import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { finalize } from 'rxjs/operators';

interface PreviewImage {
  file?: File;
  url: string;
  uploading?: boolean;
  uploaded?: boolean;
}

@Component({
  selector: 'app-product-uploader',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './product-uploader.component.html',
})
export class ProductUploaderComponent {
  form: FormGroup;
  previews: PreviewImage[] = [];
  uploading = false;
  message = '';

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

  /** ----------- CLEAN GETTERS FOR TEMPLATE ------------ **/

  get hasPendingUploads(): boolean {
    return this.previews.some(p => p.file || p.uploading);
  }

  get hasFilesToUpload(): boolean {
    return this.previews.some(p => p.file);
  }

  get noPreviews(): boolean {
    return this.previews.length === 0;
  }

  /** --------------------------------------------------- **/

  onFilesSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement | null;
    if (!input?.files) return;
    this.addFiles(Array.from(input.files));
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
        next: (res: { urls: string[] }) => {
          if (!res?.urls?.length) {
            this.message = 'Unexpected server response.';
            return;
          }

          let idx = 0;
          this.previews = this.previews.map(p => {
            if (p.file) {
              return {
                url: res.urls[idx++],
                uploaded: true,
                uploading: false
              };
            }
            return p;
          });

          this.message = 'Upload complete.';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Upload error', err);
          this.message = err?.error?.message || 'Upload failed';
          this.previews = this.previews.map(p => ({ ...p, uploading: false }));
          this.cdr.detectChanges();
        }
      });
  }

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

    const images = this.previews.map(p => p.url).filter(Boolean);

    if (images.length === 0) {
      this.message = 'Please upload or add an image.';
      return;
    }

    if (images.some(u => !/^https?:\/\//i.test(u))) {
      this.message = 'Invalid image URL detected.';
      return;
    }

    const payload = {
      title: this.form.value.title,
      price: this.form.value.price,
      description: this.form.value.description || '',
      images
    };

    this.productSvc.createProduct(payload).subscribe({
      next: () => {
        this.message = 'Product created successfully!';
        this.form.reset();
        this.previews = [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Create product error', err);
        const msg = err?.error?.error || err?.error?.message || 'Failed to create';
        this.message = msg;
      }
    });
  }

  addExternalUrl(url: string): void {
    if (!url.trim()) return;
    this.previews = [...this.previews, { url: url.trim(), uploaded: true }];
    this.cdr.markForCheck();
  }
}
