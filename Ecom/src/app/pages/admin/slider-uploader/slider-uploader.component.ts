import { Component, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProductService } from '../../../services/product.service';
import { finalize } from 'rxjs/operators';

interface SlidePreview {
  file?: File;
  url: string;          // Cloudinary URL ONLY (no Base64)
  tempPreview?: string; // Local Blob URL for preview
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
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './slider-uploader.component.html',
})
export class SliderUploaderComponent {

  previews = signal<SlidePreview[]>([]);
  uploading = signal(false);
  message = signal('');

  constructor(
    private productSvc: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  // ---------------------------------------
  // SELECT FILES → AUTO-UPLOAD
  // ---------------------------------------
  onFilesSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement | null;
    if (!input?.files) return;

    const files = Array.from(input.files);
    input.value = '';

    this.autoUpload(files);
  }

  // ---------------------------------------
  // AUTO UPLOAD — removes Base64 completely
  // ---------------------------------------
  autoUpload(files: File[]) {
    if (files.length === 0) return;

    this.uploading.set(true);

    // Create blob preview
    files.forEach(file => {
      const blobURL = URL.createObjectURL(file);

      this.previews.update(list => [
        ...list,
        {
          file,
          tempPreview: blobURL,
          url: '',
          uploading: true,
          uploaded: false,
        }
      ]);
    });

    this.productSvc.uploadSliderImages(files)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (res: { urls: string[] }) => {
          let i = 0;
          this.previews.update(list =>
            list.map(item => {
              if (item.file && !item.uploaded) {
                const cloudUrl = res.urls[i++];
                return {
                  ...item,
                  url: cloudUrl,
                  file: undefined,
                  tempPreview: undefined,
                  uploading: false,
                  uploaded: true
                };
              }
              return item;
            })
          );
        },
        error: () => {
          this.message.set('Upload failed.');
          this.previews.update(list =>
            list.filter(p => p.uploaded)
          );
        }
      });
  }

  // ---------------------------------------
  // ADD EXTERNAL URL (always uploaded)
  // ---------------------------------------
  addExternalUrl(url: string) {
    if (!url.trim()) return;

    this.previews.update(list => [
      ...list,
      {
        url: url.trim(),
        uploaded: true
      }
    ]);
  }

  // ---------------------------------------
  // REMOVE SLIDE
  // ---------------------------------------
  removePreview(i: number) {
    this.previews.update(list => list.filter((_, idx) => idx !== i));
  }

  // ---------------------------------------
  // REORDER (Drag Drop)
  // ---------------------------------------
  drop(event: CdkDragDrop<SlidePreview[]>) {
    const list = [...this.previews()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.previews.set(list);
  }

  // ---------------------------------------
  // SAVE SLIDER — auto-upload pending files
  // ---------------------------------------
  saveSlider() {
    const list = this.previews();

    if (list.length === 0) {
      this.message.set('No slides to save.');
      return;
    }

    // Detect unuploaded or Base64 images
    const needUpload = list.filter(p =>
      !p.uploaded ||
      p.url.startsWith('data:image') ||
      (!p.url && p.tempPreview)
    );

    if (needUpload.length > 0) {
      const files = needUpload
        .map(p => p.file)
        .filter(f => !!f) as File[];

      if (files.length > 0) {
        this.message.set('Uploading pending images...');
        this.autoUpload(files);
        return;
      }
    }

    // Build payload
    const payload = list.map((p, index) => ({
      imageUrl: p.url, // Cloudinary URL ONLY
      title: p.title || '',
      subtitle: p.subtitle || '',
      buttonText: p.buttonText || '',
      buttonLink: p.buttonLink || '',
      order: index + 1,
      active: true
    }));

    this.productSvc.saveSlider(payload).subscribe({
      next: () => this.message.set('Slider saved successfully!'),
      error: err =>
        this.message.set(err?.error?.message || 'Failed to save slider.')
    });
  }
}
