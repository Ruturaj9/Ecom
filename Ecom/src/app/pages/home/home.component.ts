import { Component, ChangeDetectorRef, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnDestroy {

  router = inject(Router);
  productSvc = inject(ProductService);
  cdr = inject(ChangeDetectorRef);

  // -----------------------------
  // SIGNAL STATE
  // -----------------------------
  sliders = signal<any[]>([]);
  sliderLoading = signal(true);
  sliderError = signal('');

  featured = signal<any[]>([]);
  productLoading = signal(true);
  productError = signal('');

  // -----------------------------
  // SLIDER LOGIC
  // -----------------------------
  currentSlide = 0;
  private timer: any;

  constructor() {
    this.loadSliders();
    this.loadProducts();
  }

  // -----------------------------
  // FIX: Return correct image (string OR object {desktop,mobile})
  // -----------------------------
  getImage(slide: any): string {
    if (!slide || !slide.imageUrl) return '';

    // Case 1: string (legacy URL)
    if (typeof slide.imageUrl === 'string') {
      return slide.imageUrl;
    }

    // Case 2: object {desktop, mobile}
    return window.innerWidth < 768
      ? slide.imageUrl.mobile
      : slide.imageUrl.desktop;
  }

  // -----------------------------
  // Load Public Sliders
  // -----------------------------
  loadSliders() {
    this.productSvc.getSlidersPublic().subscribe({
      next: (res: any) => {
        this.sliders.set(res.sliders || []);
        this.sliderLoading.set(false);
        this.startAutoSlide();
      },
      error: () => {
        this.sliderError.set('Failed to load sliders');
        this.sliderLoading.set(false);
      }
    });
  }

  // -----------------------------
  // Load Public Products
  // -----------------------------
  loadProducts() {
    this.productSvc.getPublicProducts().subscribe({
      next: (res: any) => {
        this.featured.set(res.products || []);
        this.productLoading.set(false);
      },
      error: () => {
        this.productError.set('Failed to load products');
        this.productLoading.set(false);
      }
    });
  }

  // -----------------------------
  // SLIDER AUTOPLAY
  // -----------------------------
  startAutoSlide() {
    this.stopAutoSlide();
    this.timer = setInterval(() => this.next(), 5000);
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

  // -----------------------------
  // SWIPE CONTROLS
  // -----------------------------
  touchStartX = 0;
  touchEndX = 0;

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

  // -----------------------------
  // CATEGORY
  // -----------------------------
  categories = [
    { id: 1, name: 'Vegetables', icon: '🥕' },
    { id: 2, name: 'Fruits', icon: '🍎' },
    { id: 3, name: 'Grains', icon: '🌾' },
    { id: 4, name: 'Dairy', icon: '🧀' },
    { id: 5, name: 'Pulses', icon: '🫘' },
    { id: 6, name: 'Seeds', icon: '🌱' }
  ];

  goToCategory(c: any) {
    this.router.navigate(['/products'], { queryParams: { category: c.name } });
  }

  // -----------------------------
  // Fix: Button link support
  // -----------------------------
  go(slide: any) {
    if (!slide?.buttonLink) return;
    this.router.navigate([slide.buttonLink]);
  }

  // -----------------------------
  // DESTROY
  // -----------------------------
  ngOnDestroy() {
    this.stopAutoSlide();
  }
}
