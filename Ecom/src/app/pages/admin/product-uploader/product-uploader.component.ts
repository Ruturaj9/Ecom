import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { finalize } from 'rxjs/operators';

interface PreviewImage {
  file?: File;
  url: string;       // full uploaded URL or external URL
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
})
export class ProductUploaderComponent implements OnInit {
  form: FormGroup;
  previews: PreviewImage[] = [];
  uploading = false;
  message = '';

  // Categories
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
    this.form = this.fb.group({
      title: ['', Validators.required],
      price: [null, Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  // ---------- Getters ----------
  get hasPendingUploads(): boolean {
    return this.previews.some(p => p.file || p.uploading);
  }

  get hasFilesToUpload(): boolean {
    return this.previews.some(p => !!p.file);
  }

  get noPreviews(): boolean {
    return this.previews.length === 0;
  }

  // ---------- Category APIs (uses ProductService) ----------
  loadCategories(): void {
    this.productSvc.getCategories().subscribe({
      next: (res) => {
        this.categories = res.categories || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Don't show a blocking error; admin might not be logged in.
        console.warn('Could not load categories', err?.message || err);
      }
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
            // add to list and select
            this.categories = [res.category, ...this.categories];
            this.selectedCategoryId = res.category._id;
            this.showNewCategory = false;
            this.newCategoryName = '';
            this.newCategoryDescription = '';
            this.message = 'Category created and selected.';
          } else {
            this.message = 'Category created but server response was unexpected.';
          }
        },
        error: (err) => {
          // handle common cases
          if (err?.status === 401 || err?.status === 403) {
            this.message = 'You must be logged in as admin to create categories. Please login.';
          } else if (err?.status === 409) {
            this.message = 'That category already exists.';
          } else if (err?.error?.error) {
            this.message = err.error.error;
          } else if (err?.error?.message) {
            this.message = err.error.message;
          } else {
            this.message = 'Failed to create category. Check network or server logs.';
          }
          console.error('Create category failed', err);
        }
      });
  }

  // ---------- File Selection ----------
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

  // ---------- Drag & Drop ----------
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

  // ---------- Upload to Server ----------
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
            this.previews = this.previews.map(p => ({ ...p, uploading: false }));
            this.cdr.markForCheck();
            return;
          }

          let idx = 0;

          this.previews = this.previews.map(p => {
            if (p.file) {
              const uploadedUrl = res.urls[idx++] || null;
              if (!uploadedUrl) return { ...p, uploading: false };

              return {
                url: uploadedUrl,
                uploaded: true,
                uploading: false
              };
            }
            return p;
          });

          this.message = 'Upload complete.';
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.message = err?.error?.message || 'Upload failed';
          this.previews = this.previews.map(p => ({ ...p, uploading: false }));
          this.cdr.detectChanges();
        }
      });
  }

  // ---------- Create Product ----------
  createProduct(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message = 'Please fill all required fields.';
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
        const msg = err?.error?.error || err?.error?.message || 'Failed to create product';
        this.message = msg;
      }
    });
  }

  // ---------- Add URL Manually ----------
  addExternalUrl(url: string): void {
    const trimmed = url.trim();
    if (!trimmed) return;

    this.previews = [...this.previews, { url: trimmed, uploaded: true }];
    this.cdr.markForCheck();
  }
}
