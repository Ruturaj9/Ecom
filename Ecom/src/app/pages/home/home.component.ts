import { Component, ChangeDetectorRef, OnDestroy, inject, signal } from '@angular/core';
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
export class HomeComponent implements OnDestroy {

  router = inject(Router);
  productSvc = inject(ProductService);
  cdr = inject(ChangeDetectorRef);

  // -----------------------------
  // SLIDER SIGNALS
  // -----------------------------
  sliders = signal<any[]>([]);
  sliderLoading = signal(true);
  sliderError = signal('');
  currentSlide = 0;
  private timer: any;

  // -----------------------------
  // CATEGORIES SIGNALS
  // -----------------------------
  categories = signal<any[]>([]);
  categoryLoading = signal(true);
  categoryError = signal('');

  // -----------------------------
  // PRODUCTS SIGNALS (with pagination)
  // -----------------------------
  featured = signal<any[]>([]);
  productLoading = signal(true);
  productError = signal('');

  currentPage = signal(1);
  totalPages = signal(1);

  constructor() {
    this.loadSliders();
    this.loadCategories();
    this.loadProducts();
  }

  // -----------------------------
  // IMAGE PICKER (desktop/mobile)
  // -----------------------------
  getImage(slide: any): string {
    if (!slide?.imageUrl) return '';
    if (typeof slide.imageUrl === 'string') return slide.imageUrl;

    return window.innerWidth < 768
      ? slide.imageUrl.mobile
      : slide.imageUrl.desktop;
  }

  // -----------------------------
  // LOAD SLIDERS
  // -----------------------------
  loadSliders() {
    this.productSvc.getSlidersPublic().subscribe({
      next: (res: any) => {
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

  // -----------------------------
  // AUTO SLIDER 4 SEC
  // -----------------------------
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

  // -----------------------------
  // SLIDER SWIPE
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
  // LOAD CATEGORIES
  // -----------------------------
  loadCategories() {
    this.productSvc.getPublicCategories().subscribe({
      next: (res) => {
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

  // -----------------------------
  // LOAD PRODUCTS (PAGINATION)
  // -----------------------------
  loadProducts() {
    this.productLoading.set(true);

    this.productSvc.getPublicProductsPaginated({
      page: this.currentPage(),
      limit: 8
    }).subscribe({
      next: (res) => {
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

  goToPage(n: number) {
    if (n < 1 || n > this.totalPages()) return;
    this.currentPage.set(n);
    this.loadProducts();
  }

  // -----------------------------
  // SLIDER BUTTON LINK
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
