import {
  Component,
  ChangeDetectorRef,
  OnDestroy,
  AfterViewInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnDestroy, AfterViewInit {

  router = inject(Router);
  productSvc = inject(ProductService);
  cdr = inject(ChangeDetectorRef);

  // =============================
  // IMAGE SLIDER
  // =============================
  sliders = signal<any[]>([]);
  sliderLoading = signal(true);
  sliderError = signal('');
  currentSlide = 0;
  private timer: any;

  // swipe
  touchStartX = 0;
  touchEndX = 0;

  // =============================
  // VIDEO REELS
  // =============================
  videoSliders = signal<any[]>([]);
  videoLoading = signal(true);
  videoError = signal('');

  videoProgress = new Map<number, number>();
  videoMuted = new Map<number, boolean>();
  videoPlaying = new Map<number, boolean>();

  private progressRAF = new Map<number, number>();

  private autoScrollTimer?: any;
  autoScrollPaused = false;

  private videoObserver?: IntersectionObserver;

  // =============================
  // CATEGORIES
  // =============================
  categories = signal<any[]>([]);
  categoryLoading = signal(true);
  categoryError = signal('');

  // =============================
  // PRODUCTS
  // =============================
  featured = signal<any[]>([]);
  productLoading = signal(true);
  productError = signal('');
  currentPage = signal(1);
  totalPages = signal(1);

  constructor() {
    this.loadSliders();
    this.loadVideoSliders();
    this.loadCategories();
    this.loadProducts();
  }

  // =============================
  // MEDIA PICKERS
  // =============================
  getImage(slide: any): string {
    if (!slide?.imageUrl) return '';
    return window.innerWidth < 768
      ? slide.imageUrl.mobile
      : slide.imageUrl.desktop;
  }

  getVideo(video: any): string {
    if (!video?.videoUrl) return '';
    return window.innerWidth < 768
      ? video.videoUrl.mobile
      : video.videoUrl.desktop;
  }

  // =============================
  // LOADERS
  // =============================
  loadSliders() {
    this.productSvc.getSlidersPublic().subscribe({
      next: res => {
        this.sliders.set(res.sliders || []);
        this.sliderLoading.set(false);
        this.startAutoSlide();
      },
      error: () => {
        this.sliderError.set('Failed to load homepage sliders');
        this.sliderLoading.set(false);
      }
    });
  }

  loadVideoSliders() {
    this.productSvc.getVideoSlidersPublic().subscribe({
      next: res => {
        this.videoSliders.set(res.videos || []);
        this.videoLoading.set(false);
        this.startVideoAutoScroll();
      },
      error: () => {
        this.videoError.set('Failed to load videos');
        this.videoLoading.set(false);
      }
    });
  }

  // =============================
  // IMAGE SLIDER
  // =============================
  startAutoSlide() {
    this.stopAutoSlide();
    this.timer = setInterval(() => this.next(), 4000);
  }

  stopAutoSlide() {
    if (this.timer) clearInterval(this.timer);
  }

  next() {
    const list = this.sliders();
    if (!list.length) return;
    this.currentSlide = (this.currentSlide + 1) % list.length;
    this.cdr.markForCheck();
  }

  prev() {
    const list = this.sliders();
    if (!list.length) return;
    this.currentSlide = (this.currentSlide - 1 + list.length) % list.length;
    this.cdr.markForCheck();
  }

  goTo(i: number) {
    this.currentSlide = i;
    this.startAutoSlide();
    this.cdr.markForCheck();
  }

  // swipe handlers (RESTORED)
  onTouchStart(e: TouchEvent) {
    this.stopAutoSlide();
    this.touchStartX = e.touches[0].clientX;
  }

  onTouchMove(e: TouchEvent) {
    this.touchEndX = e.touches[0].clientX;
  }

  onTouchEnd() {
    const delta = this.touchEndX - this.touchStartX;
    if (delta > 50) this.prev();
    else if (delta < -50) this.next();
    this.startAutoSlide();
  }

  // =============================
  // VIDEO PLAY / MUTE
  // =============================
  toggleVideo(index: number) {
    const el = this.getVideoEl(index);
    if (!el) return;

    if (el.muted) {
      el.muted = false;
      this.videoMuted.set(index, false);
    }

    if (el.paused) {
      el.play().catch(() => {});
      this.videoPlaying.set(index, true);
      this.preloadNextVideo(index);
    } else {
      el.pause();
      this.videoPlaying.set(index, false);
    }

    this.cdr.markForCheck();
  }

  toggleMute(index: number) {
    const el = this.getVideoEl(index);
    if (!el) return;

    el.muted = !el.muted;
    this.videoMuted.set(index, el.muted);

    el.classList.remove('mute-ripple');
    void el.offsetWidth;
    el.classList.add('mute-ripple');

    this.cdr.markForCheck();
  }

  isMuted(index: number): boolean {
    return this.videoMuted.get(index) ?? true;
  }

  isPlaying(index: number): boolean {
    return this.videoPlaying.get(index) ?? false;
  }

  // =============================
  // PROGRESS (ELASTIC)
  // =============================
  getProgress(index: number): number {
    return this.videoProgress.get(index) || 0;
  }

  private easeProgress(index: number, target: number) {
    cancelAnimationFrame(this.progressRAF.get(index)!);

    const start = this.videoProgress.get(index) || 0;
    const diff = target - start;
    const startTime = performance.now();

    const animate = (t: number) => {
      const p = Math.min((t - startTime) / 180, 1);
      const eased = start + diff * (1 - Math.pow(1 - p, 3));
      this.videoProgress.set(index, eased);
      this.cdr.markForCheck();
      if (p < 1) this.progressRAF.set(index, requestAnimationFrame(animate));
    };

    this.progressRAF.set(index, requestAnimationFrame(animate));
  }

  // =============================
  // AFTER VIEW INIT
  // =============================
  ngAfterViewInit() {
    this.videoObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const video = entry.target as HTMLVideoElement;
          const index = Number(video.dataset['videoIndex']);
          const data = this.videoSliders()[index];
          if (!data) return;

          if (entry.isIntersecting) {
            if (!video.src) {
              video.src = this.getVideo(data);
              video.load();
            }
            video.play().catch(() => {});
            this.videoPlaying.set(index, true);
          } else {
            video.pause();
            this.videoPlaying.set(index, false);
          }
        });
      },
      { threshold: 0.6 }
    );

    setTimeout(() => {
      document
        .querySelectorAll<HTMLVideoElement>('video[data-observe-video]')
        .forEach(video => {
          const index = Number(video.dataset['videoIndex']);

          this.videoMuted.set(index, video.muted);
          this.videoPlaying.set(index, !video.paused);

          video.addEventListener('timeupdate', () => {
            if (!video.duration) return;
            const pct = (video.currentTime / video.duration) * 100;
            this.easeProgress(index, pct);
          });

          video.addEventListener('ended', () => {
            this.videoProgress.set(index, 0);
            this.videoPlaying.set(index, false);
            this.cdr.markForCheck();
          });

          video.tabIndex = 0;
          video.addEventListener('keydown', e => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              this.toggleVideo(index);
            }
            if (e.key.toLowerCase() === 'm') {
              this.toggleMute(index);
            }
          });

          this.videoObserver?.observe(video);
        });
    });
  }

  // =============================
  // VIDEO AUTO SCROLL
  // =============================
  startVideoAutoScroll() {
    this.stopVideoAutoScroll();
    this.autoScrollTimer = setInterval(() => {
      if (this.autoScrollPaused) return;
      document
        .querySelector('.video-auto-scroll')
        ?.scrollBy({ left: 320, behavior: 'smooth' });
    }, 5000);
  }

  stopVideoAutoScroll() {
    if (this.autoScrollTimer) clearInterval(this.autoScrollTimer);
  }

  pauseVideoAutoScroll() {
    this.autoScrollPaused = true;
  }

  resumeVideoAutoScroll() {
    this.autoScrollPaused = false;
  }

  scrollVideoGridLeft(container: HTMLElement | null) {
    if (!container) return;
    this.pauseVideoAutoScroll();
    container.scrollBy({ left: -400, behavior: 'smooth' });
  }

  scrollVideoGridRight(container: HTMLElement | null) {
    if (!container) return;
    this.pauseVideoAutoScroll();
    container.scrollBy({ left: 400, behavior: 'smooth' });
  }

  // =============================
  // PRELOAD
  // =============================
  private preloadNextVideo(index: number) {
    const next = this.videoSliders()[index + 1];
    if (!next?.videoUrl?.desktop) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = this.getVideo(next);
    document.head.appendChild(link);
  }

  // =============================
  // CATEGORIES / PRODUCTS
  // =============================
  loadCategories() {
    this.productSvc.getPublicCategories().subscribe({
      next: res => {
        this.categories.set(res.categories || []);
        this.categoryLoading.set(false);
      },
      error: () => {
        this.categoryError.set('Failed to load categories.');
        this.categoryLoading.set(false);
      }
    });
  }

  goToCategory(name: string) {
    this.router.navigate(['/products'], { queryParams: { category: name } });
  }

  loadProducts() {
    this.productLoading.set(true);
    this.productSvc.getPublicProductsPaginated({
      page: this.currentPage(),
      limit: 8
    }).subscribe({
      next: res => {
        this.featured.set(res.products || []);
        this.totalPages.set(res.totalPages || 1);
        this.productLoading.set(false);
      },
      error: () => {
        this.productError.set('Failed to load products.');
        this.productLoading.set(false);
      }
    });
  }

  nextPage() {
    if (this.currentPage() >= this.totalPages()) return;
    this.currentPage.set(this.currentPage() + 1);
    this.loadProducts();
  }

  prevPage() {
    if (this.currentPage() <= 1) return;
    this.currentPage.set(this.currentPage() - 1);
    this.loadProducts();
  }

  go(slide: any) {
    if (!slide?.buttonLink) return;
    this.router.navigate([slide.buttonLink]);
  }

  private getVideoEl(index: number): HTMLVideoElement | null {
    return document.querySelector<HTMLVideoElement>(
      `video[data-video-index="${index}"]`
    );
  }

  ngOnDestroy() {
    this.stopAutoSlide();
    this.stopVideoAutoScroll();
    this.videoObserver?.disconnect();
  }
}
