// src/app/pages/admin/slider-uploader/slider-uploader.component.ts
import { Component, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProductService } from '../../../services/product.service';
import { finalize } from 'rxjs/operators';

type UrlVariant = string | { desktop: string; mobile: string };

interface SlidePreview {
  file?: File;
  url: UrlVariant | '';
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  uploading?: boolean;
  uploaded?: boolean;
  tempPreview?: string;
  active?: boolean;
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

  /** notify home page / preview page */
  @Output() slidersUpdated = new EventEmitter<void>();

  constructor(
    private productSvc: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  /** pick correct image for preview */
  getImage(p: SlidePreview): string {
    if (!p.url) return p.tempPreview || '';
    if (typeof p.url === 'string') return p.url;
    return p.url.desktop || p.url.mobile || '';
  }

  /** Disable Save button until every image is uploaded */
  disableSaveButton(): boolean {
    return (
      this.uploading ||
      this.previews.length === 0 ||
      this.previews.some(p => !p.uploaded)
    );
  }

  /** file input selection */
  onFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    input.value = '';
    this.addFiles(files);
  }

  /** create preview objects */
  addFiles(files: File[]) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      this.previews.push({
        file,
        url: '',
        tempPreview: URL.createObjectURL(file),
        uploading: false,
        uploaded: false,
        active: true
      });
    }
    this.cdr.markForCheck();
  }

  /** upload images to Cloudinary */
  uploadToServer() {
    const files = this.previews.filter(p => p.file).map(p => p.file!) as File[];
    if (files.length === 0) {
      this.message = 'No new images to upload.';
      return;
    }

    this.uploading = true;
    this.previews.forEach(p => { if (p.file) p.uploading = true; });

    this.productSvc
      .uploadSliderImages(files)
      .pipe(finalize(() => { this.uploading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (res: { urls: { desktop: string; mobile: string }[] }) => {

          let i = 0;
          this.previews = this.previews.map(p => {
            if (p.file) {
              const r = res.urls[i++];
              return {
                ...p,
                url: { desktop: r.desktop, mobile: r.mobile },
                uploaded: true,
                uploading: false,
                file: undefined,
                tempPreview: undefined
              };
            }
            return p;
          });

          this.message = 'Upload complete.';
          this.cdr.markForCheck();
        },
        error: () => {
          this.message = 'Upload failed.';
          this.previews.forEach(p => p.uploading = false);
          this.cdr.markForCheck();
        }
      });
  }

  /** external url add */
  addExternalUrl(raw: string) {
    if (!raw.trim()) return;
    let parsed: UrlVariant = raw.trim();

    try {
      const obj = JSON.parse(raw);
      if (obj.desktop || obj.mobile) parsed = obj;
    } catch {}

    this.previews.push({
      url: parsed,
      uploaded: true,
      active: true
    });

    this.cdr.markForCheck();
  }

  /** remove */
  removePreview(i: number) {
    const p = this.previews[i];
    if (p.tempPreview) URL.revokeObjectURL(p.tempPreview);
    this.previews.splice(i, 1);
    this.cdr.markForCheck();
  }

  /** reorder */
  drop(ev: CdkDragDrop<SlidePreview[]>) {
    moveItemInArray(this.previews, ev.previousIndex, ev.currentIndex);
    this.cdr.markForCheck();
  }

  /** save everything */
  saveSlider() {
    if (this.disableSaveButton()) return;

    const payload = this.previews.map((p, index) => ({
      imageUrl: p.url,
      title: p.title || '',
      subtitle: p.subtitle || '',
      buttonText: p.buttonText || '',
      buttonLink: p.buttonLink || '',
      order: index + 1,
      active: p.active ?? true
    }));

    this.productSvc.saveSlider(payload).subscribe({
      next: () => {
        this.message = 'Slider saved successfully!';
        this.previews = [];
        this.slidersUpdated.emit();   // notify home to refresh
        this.cdr.markForCheck();
      },
      error: () => this.message = 'Failed to save slider.'
    });
  }
}
