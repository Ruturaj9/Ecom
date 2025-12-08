import { Component, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProductService } from '../../../services/product.service';
import { finalize } from 'rxjs/operators';

type UrlVariant = { desktop: string; mobile: string };

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

  @Output() slidersUpdated = new EventEmitter<void>();

  constructor(
    private productSvc: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  getImage(p: SlidePreview): string {
    if (!p.url) return p.tempPreview || '';
    return p.url.desktop;
  }

  disableSaveButton(): boolean {
    return (
      this.uploading ||
      this.previews.length === 0 ||
      this.previews.some(p => !p.uploaded)
    );
  }

  onFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    input.value = '';
    this.addFiles(files);
  }

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

  addExternalUrl(raw: string) {
    if (!raw.trim()) return;

    try {
      const obj = JSON.parse(raw.trim());
      if (obj.desktop && obj.mobile) {
        this.previews.push({
          url: obj,
          uploaded: true,
          active: true
        });
      }
    } catch {
      this.message = "Invalid JSON format. Expected {desktop, mobile}.";
    }

    this.cdr.markForCheck();
  }

  removePreview(i: number) {
    const p = this.previews[i];
    if (p.tempPreview) URL.revokeObjectURL(p.tempPreview);

    this.previews.splice(i, 1);
    this.cdr.markForCheck();
  }

  drop(ev: CdkDragDrop<SlidePreview[]>) {
    moveItemInArray(this.previews, ev.previousIndex, ev.currentIndex);
    this.cdr.markForCheck();
  }

  saveSlider() {
    if (this.disableSaveButton()) return;

    const payload = this.previews.map((p, index) => ({
      desktop: (p.url as UrlVariant).desktop,
      mobile: (p.url as UrlVariant).mobile,
      title: p.title || '',
      subtitle: p.subtitle || '',
      buttonText: p.buttonText || '',
      buttonLink: p.buttonLink || '',
      order: index + 1,
      active: p.active ?? true
    }));

    this.productSvc.createSliders(payload).subscribe({
      next: () => {
        this.message = 'Slider saved successfully!';
        this.previews = [];
        this.slidersUpdated.emit();
        this.cdr.markForCheck();
      },
      error: () => this.message = 'Failed to save slider.'
    });
  }
}
