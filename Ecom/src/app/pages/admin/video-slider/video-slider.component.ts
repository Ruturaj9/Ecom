import { Component, ChangeDetectorRef, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoSliderService } from '../../../services/video-slider.service';

@Component({
  selector: 'app-video-slider-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-slider.component.html',
})
export class VideoSliderAdminComponent implements OnInit {

  videos = signal<any[]>([]);
  loading = signal(true);
  error = signal('');

  page = 1;
  limit = 8;
  totalPages = 1;

  constructor(
    private videoSliderSvc: VideoSliderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.videoSliderSvc.getAdminList(this.page, this.limit).subscribe({
      next: (res) => {
        this.videos.set(res.videos || []);
        this.totalPages = res.pagination?.totalPages || 1;
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.error.set('Failed to load videos');
        this.loading.set(false);
      }
    });
  }

  toggleActive(v: any): void {
    this.videoSliderSvc.toggleActive(v._id, !v.active).subscribe({
      next: () => {
        v.active = !v.active;
        this.cdr.markForCheck();
      }
    });
  }

  delete(id: string): void {
    if (!confirm('Delete this video?')) return;

    this.videoSliderSvc.delete(id).subscribe({
      next: () => this.load()
    });
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.load();
  }

  prevPage(): void {
    if (this.page <= 1) return;
    this.page--;
    this.load();
  }
}
