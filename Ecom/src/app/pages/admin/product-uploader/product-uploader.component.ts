import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { finalize } from 'rxjs/operators';

interface PreviewImage {
  file?: File;
  url: string;
  uploading?: boolean;
  uploaded?: boolean;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
}

@Component({
  selector: 'app-product-uploader',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DragDropModule],
  templateUrl: './product-uploader.component.html',
  styleUrls: ['./product-uploader.component.css']
})
export class ProductUploaderComponent implements OnInit {

  form: FormGroup;
  previews: PreviewImage[] = [];
  uploading = false;
  message = '';

  categories: Category[] = [];
  selectedCategoryId: string | null = null;
  showNewCategory = false;
  newCategoryName = '';
  newCategoryDescription = '';
  creatingCategory = false;

  constructor(
    private fb: FormBuilder,
    private productSvc: ProductService,
    private cdr: ChangeDetectorRef
  ) {

    /* ---------------------------------
     *     STRONG VALIDATION ADDED
     * --------------------------------- */
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],

      price: [
        null,
        [
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,2})?$/), // only valid numbers
          Validators.min(1),                         // cannot be 0 or negative
          Validators.max(10000000)                   // max limit
        ]
      ],

      description: ['', [Validators.minLength(5), Validators.maxLength(5000)]],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  /* --------------------------------------------
   *              FORM GETTERS
   * -------------------------------------------- */
  get title() { return this.form.get('title'); }
  get price() { return this.form.get('price'); }
  get description() { return this.form.get('description'); }

  get hasPendingUploads(): boolean {
    return this.previews.some(p => p.file || p.uploading);
  }

  get hasFilesToUpload(): boolean {
    return this.previews.some(p => !!p.file);
  }

  get noPreviews(): boolean {
    return this.previews.length === 0;
  }

  /* --------------------------------------------
   *            CATEGORY OPERATIONS
   * -------------------------------------------- */
  loadCategories(): void {
    this.productSvc.getCategories().subscribe({
      next: (res) => {
        this.categories = res.categories || [];
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  toggleNewCategory(): void {
    this.showNewCategory = !this.showNewCategory;
    this.newCategoryName = '';
    this.newCategoryDescription = '';
    this.message = '';
  }

  createCategory(): void {
    const name = (this.newCategoryName || '').trim();
    const description = (this.newCategoryDescription || '').trim();

    if (!name) {
      this.message = 'Please provide a category name.';
      return;
    }

    this.creatingCategory = true;
    this.message = '';

    this.productSvc.createCategory({ name, description })
      .pipe(finalize(() => {
        this.creatingCategory = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          if (res?.category) {
            this.categories = [res.category, ...this.categories];
            this.selectedCategoryId = res.category._id;

            this.showNewCategory = false;
            this.newCategoryName = '';
            this.newCategoryDescription = '';

            this.message = 'Category created successfully.';
          }
        },
        error: (err) => {
          this.message = err?.error?.message || 'Failed to create category';
        }
      });
  }

  /* --------------------------------------------
   *               IMAGE PREVIEW
   * -------------------------------------------- */
  onFilesSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement | null;
    if (!input?.files) return;

    const files = Array.from(input.files);
    this.addFiles(files);

    input.value = '';
  }

  addFiles(files: File[]): void {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      const preview: PreviewImage = { file, url: '' };

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          preview.url = reader.result;
          this.previews = [...this.previews, preview];
          this.cdr.markForCheck();
        }
      };

      reader.readAsDataURL(file);
    }
  }

  drop(event: CdkDragDrop<PreviewImage[]>): void {
    const arr = [...this.previews];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.previews = arr;
    this.cdr.markForCheck();
  }

  removePreview(index: number): void {
    const arr = [...this.previews];
    arr.splice(index, 1);
    this.previews = arr;
    this.cdr.markForCheck();
  }

  /* --------------------------------------------
   *           IMAGE UPLOAD TO SERVER
   * -------------------------------------------- */
  uploadToServer(): void {
    const files = this.previews.filter(p => p.file).map(p => p.file!);

    if (files.length === 0) {
      this.message = 'No new images to upload.';
      return;
    }

    this.uploading = true;

    this.previews = this.previews.map(p =>
      p.file ? { ...p, uploading: true } : p
    );

    this.productSvc.uploadImages(files)
      .pipe(finalize(() => {
        this.uploading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (!res?.urls?.length) {
            this.message = 'Server did not return uploaded image URLs.';
            return;
          }

          let idx = 0;

          this.previews = this.previews.map(p => {
            if (p.file) {
              const uploadedUrl = res.urls[idx++] || null;
              return {
                url: uploadedUrl || '',
                uploaded: true,
                uploading: false
              };
            }
            return p;
          });

          this.message = 'Upload complete.';
        },
        error: () => this.message = 'Upload failed',
      });
  }

  /* --------------------------------------------
   *                 CREATE PRODUCT
   * -------------------------------------------- */
  createProduct(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message = 'Please fix the highlighted fields.';
      return;
    }

    if (this.hasPendingUploads) {
      this.message = 'Please upload all images first.';
      return;
    }

    const images = this.previews
      .map(p => p.url)
      .filter(u => typeof u === 'string' && u.startsWith('http'));

    if (images.length === 0) {
      this.message = 'Please upload or add an image.';
      return;
    }

    const payload: any = {
      title: this.form.value.title,
      price: this.form.value.price,
      description: this.form.value.description || '',
      images
    };

    if (this.selectedCategoryId) {
      payload.category = this.selectedCategoryId;
    }

    this.productSvc.createProduct(payload).subscribe({
      next: () => {
        this.message = 'Product created successfully!';
        this.form.reset();
        this.previews = [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.message = err?.error?.message || 'Failed to create product';
      }
    });
  }

  /* --------------------------------------------
   *          Add URL As External Image
   * -------------------------------------------- */
  addExternalUrl(url: string): void {
    const trimmed = url.trim();
    if (!trimmed) return;

    this.previews = [...this.previews, { url: trimmed, uploaded: true }];
    this.cdr.markForCheck();
  }
}
