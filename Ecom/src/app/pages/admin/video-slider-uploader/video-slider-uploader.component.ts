import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { VideoSliderService } from '../../../services/video-slider.service';

@Component({
  selector: 'app-video-slider-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-slider-uploader.component.html',
})
export class VideoSliderUploaderComponent {

  previewVideoUrl: string | null = null;
  previewThumbnailUrl: string | null = null;

  title = '';
  subtitle = '';
  active = true;

  saving = false;
  message = '';

  private readonly API_BASE = 'http://localhost:4000/admin';

  constructor(
    private http: HttpClient,
    private videoSliderSvc: VideoSliderService,
    private cdr: ChangeDetectorRef
  ) {}

  /* -----------------------------
     FILE SELECTION
  ----------------------------- */

  onVideoSelected(event: Event): void {
    const file = this.extractFile(event);
    if (!file) return;

    const fd = new FormData();
    fd.append('video', file);

    this.http
      .post<{ url: string }>(`${this.API_BASE}/video-upload`, fd, {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.previewVideoUrl = res.url;
          this.cdr.markForCheck();
        },
        error: () => {
          this.message = 'Video upload failed.';
        },
      });
  }

  onThumbnailSelected(event: Event): void {
    const file = this.extractFile(event);
    if (!file) return;

    const fd = new FormData();
    fd.append('image', file);

    this.http
      .post<{ url: string }>(`${this.API_BASE}/upload/image`, fd, {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.previewThumbnailUrl = res.url;
          this.cdr.markForCheck();
        },
        error: () => {
          this.message = 'Thumbnail upload failed.';
        },
      });
  }

  /* -----------------------------
     SAVE METADATA (VIDEO SLIDER)
  ----------------------------- */

  save(): void {
    if (!this.previewVideoUrl) {
      this.message = 'Upload a video first.';
      return;
    }

    this.saving = true;

    const payload = {
      videos: [
        {
          desktop: this.previewVideoUrl,
          mobile: this.previewVideoUrl,
          thumbnail: this.previewThumbnailUrl,
          title: this.title?.trim() || 'Homepage Video',
          subtitle: this.subtitle,
          active: this.active,
          order: 1,
        },
      ],
    };

    this.videoSliderSvc.createVideoSliders(payload.videos).subscribe({
      next: () => {
        this.message = 'Video uploaded successfully.';
        this.reset();
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.message = 'Failed to save video.';
        this.saving = false;
      },
    });
  }

  reset(): void {
    this.previewVideoUrl = null;
    this.previewThumbnailUrl = null;
    this.title = '';
    this.subtitle = '';
    this.active = true;
    this.message = '';
  }

  /* -----------------------------
     SAFE FILE EXTRACTION
  ----------------------------- */

  private extractFile(event: Event): File | null {
    const input = event.target as HTMLInputElement | null;
    if (!input || !input.files || input.files.length === 0) return null;
    return input.files[0];
  }
}
