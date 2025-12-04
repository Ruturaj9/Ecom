import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProductService } from '../../../services/product.service';
import { finalize } from 'rxjs/operators';

interface SlidePreview {
  file?: File;
  url: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  uploading?: boolean;
  uploaded?: boolean;
}

@Component({
  selector: 'app-slider-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './slider-uploader.component.html',
})
export class SliderUploaderComponent {

  previews: SlidePreview[] = [];
  uploading = false;
  message = '';

  constructor(
    private productSvc: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  // -------------------------
  // SELECT FILES
  // -------------------------
  onFilesSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement | null;
    if (!input?.files) return;

    this.addFiles(Array.from(input.files));
    input.value = '';
  }

  // -------------------------
  // CREATE LOCAL PREVIEW
  // -------------------------
  addFiles(files: File[]): void {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      const preview: SlidePreview = { file, url: '' };

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

  // -------------------------
  // DRAG-DROP REORDER
  // -------------------------
  drop(event: CdkDragDrop<SlidePreview[]>): void {
    const arr = [...this.previews];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.previews = arr;
    this.cdr.markForCheck();
  }

  // -------------------------
  // REMOVE SLIDE
  // -------------------------
  removePreview(i: number): void {
    const arr = [...this.previews];
    arr.splice(i, 1);
    this.previews = arr;
    this.cdr.markForCheck();
  }

  // -------------------------
  // UPLOAD IMAGES TO CLOUDINARY
  // -------------------------
  uploadToServer(): void {
    const files = this.previews.filter(p => p.file).map(p => p.file!);

    if (files.length === 0) {
      this.message = 'No new images to upload.';
      return;
    }

    this.uploading = true;
    this.previews = this.previews.map(p => p.file ? { ...p, uploading: true } : p);

    this.productSvc.uploadSliderImages(files)
      .pipe(finalize(() => { this.uploading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (res: { urls: string[] }) => {
          let idx = 0;

          this.previews = this.previews.map(p => {
            if (p.file) {
              const newUrl = res.urls[idx++];
              return {
                ...p,
                url: newUrl,
                file: undefined,
                uploaded: true,
                uploading: false
              };
            }
            return p;
          });

          this.message = 'Upload complete.';
        },
        error: (err) => {
          console.error(err);
          this.message = err?.error?.message || 'Upload failed.';
          this.previews = this.previews.map(p => ({ ...p, uploading: false }));
        }
      });
  }

  // -------------------------
  // ADD EXTERNAL URL
  // -------------------------
  addExternalUrl(url: string): void {
    if (!url.trim()) return;
    this.previews.push({ url: url.trim(), uploaded: true });
    this.cdr.markForCheck();
  }

  // -------------------------
  // SAVE SLIDER TO BACKEND
  // -------------------------
  saveSlider(): void {
    if (this.previews.length === 0) {
      this.message = 'No slides to save.';
      return;
    }

    const payload = this.previews.map((p, index) => ({
      imageUrl: p.url,
      title: p.title || '',
      subtitle: p.subtitle || '',
      buttonText: p.buttonText || '',
      buttonLink: p.buttonLink || '',
      order: index + 1
    }));

    this.productSvc.saveSlider(payload).subscribe({
      next: () => {
        this.message = 'Slider saved successfully!';
      },
      error: (err) => {
        console.error(err);
        this.message = err?.error?.message || 'Failed to save slider.';
      }
    });
  }

}
