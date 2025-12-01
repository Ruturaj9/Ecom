import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnDestroy {

  /* ------------------ OFFER SLIDER ------------------ */
  offerImages = [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80',
    'https://imgs.search.brave.com/YUSKyf0acvnM7QkS4xIj1hvNEDEQHw3Hr_Zp1l7Vv4k/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wMTEv/MTQxLzExNy9zbWFs/bC92ZWdldGFibGVz/LW9uLXN0b3JlLWNv/dW50ZXItc2FsZS1v/Zi12ZWdldGFibGVz/LW9uLW1hcmtldC1m/cmVzaC1mcnVpdC1o/ZWFsdGh5LWZvb2Qt/cGhvdG8uanBn',
    'https://imgs.search.brave.com/lB3jnkrzcVThmKsu1m5OSUK94szPLE4pw1tdiByoNkg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wMjMv/ODc5LzE3MC9zbWFs/bC90aGUtZ3JvY2Vy/eS1zdG9yZS1zZWxs/cy12YXJpb3VzLXZl/Z2V0YWJsZXMtdG9t/YXRvZXMtY3VjdW1i/ZXJzLWVnZ3BsYW50/cy1wZXBwZXJzLXp1/Y2NoaW5pLXZlZ2V0/YWJsZXMtYXJlLW9u/LXRoZS1zaGVsZi1p/bi10aGUtZ3JvY2Vy/eS1zdG9yZS1waG90/by5qcGc',
    'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=1600&q=80',
    'https://imgs.search.brave.com/7Xle7XNjmG0RtYyH0sVdQKJV67TbXvONuAPfMfw0CsU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9va2Ny/ZWRpdC1ibG9nLWlt/YWdlcy1wcm9kLnN0/b3JhZ2UuZ29vZ2xl/YXBpcy5jb20vMjAy/MS8wMi92ZWdldGFi/bGUtc3RvcmUuanBn'
  ];

  currentSlide = 0;

  // Auto-slide timer handle
  private autoSlideTimer: any = null;

  // Pointer / swipe
  private pointerStartX: number | null = null;
  private pointerDeltaX = 0;
  private pointerActive = false;
  private readonly SWIPE_THRESHOLD = 50; // px

  // Debounce for manual interactions
  private lastInteraction = 0;
  private readonly INTERACTION_DEBOUNCE_MS = 300;

  constructor() {
    this.startAutoSlide();
  }

  /* ---------- Auto slide ---------- */
  private startAutoSlide() {
    this.clearAutoSlide();
    this.autoSlideTimer = setInterval(() => this.nextSlideInternal(), 3000);
  }

  private clearAutoSlide() {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }
  }

  private resetAutoSlide() {
    this.clearAutoSlide();
    setTimeout(() => this.startAutoSlide(), 2000);
  }

  /* ---------- Internal navigation ---------- */
  private nextSlideInternal() {
    this.currentSlide = (this.currentSlide + 1) % this.offerImages.length;
  }

  private prevSlideInternal() {
    this.currentSlide =
      (this.currentSlide - 1 + this.offerImages.length) %
      this.offerImages.length;
  }

  /* ---------- User interactions ---------- */
  nextClicked() {
    if (this.interactionBlocked()) return;
    this.lastInteraction = Date.now();
    this.nextSlideInternal();
    this.resetAutoSlide();
  }

  prevClicked() {
    if (this.interactionBlocked()) return;
    this.lastInteraction = Date.now();
    this.prevSlideInternal();
    this.resetAutoSlide();
  }

  goToSlide(index: number) {
    if (this.interactionBlocked()) return;
    this.lastInteraction = Date.now();
    if (index >= 0 && index < this.offerImages.length) {
      this.currentSlide = index;
      this.resetAutoSlide();
    }
  }

  private interactionBlocked() {
    return Date.now() - this.lastInteraction < this.INTERACTION_DEBOUNCE_MS;
  }

  /* ---------- Swipe support ---------- */
  onPointerDown(ev: PointerEvent) {
    if (!ev.isPrimary) return;
    this.pointerActive = true;
    this.pointerStartX = ev.clientX;
    this.pointerDeltaX = 0;
    this.clearAutoSlide();
    try { (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId); } catch {}
  }

  onPointerMove(ev: PointerEvent) {
    if (!this.pointerActive || this.pointerStartX === null) return;
    this.pointerDeltaX = ev.clientX - this.pointerStartX;
  }

  onPointerUp(ev: PointerEvent) {
    if (!this.pointerActive) return;
    this.pointerActive = false;

    try { (ev.target as HTMLElement).releasePointerCapture?.(ev.pointerId); } catch {}

    const delta = this.pointerDeltaX;
    this.pointerStartX = null;
    this.pointerDeltaX = 0;

    if (delta > this.SWIPE_THRESHOLD) {
      this.prevClicked();
    } else if (delta < -this.SWIPE_THRESHOLD) {
      this.nextClicked();
    } else {
      this.resetAutoSlide();
    }
  }

  ngOnDestroy() {
    this.clearAutoSlide();
  }

  /* ------------------ CATEGORIES ------------------ */
  categories = [
    { id: 1, name: 'Vegetables', icon: '🥕' },
    { id: 2, name: 'Fruits', icon: '🍎' },
    { id: 3, name: 'Grains', icon: '🌾' },
    { id: 4, name: 'Dairy', icon: '🧀' },
    { id: 5, name: 'Pulses', icon: '🫘' },
    { id: 6, name: 'Seeds', icon: '🌱' }
  ];

  /* ------------------ FEATURED PRODUCTS ------------------ */
  featured = [
    { id: 1, title: 'Potatoes', price: 22, location: 'Pune', image: 'https://picsum.photos/seed/p1/600/400' },
    { id: 2, title: 'Tomatoes', price: 40, location: 'Nashik', image: 'https://picsum.photos/seed/p2/600/400' },
    { id: 3, title: 'Onions', price: 35, location: 'Solapur', image: 'https://picsum.photos/seed/p3/600/400' },
    { id: 4, title: 'Banana', price: 55, location: 'Satara', image: 'https://picsum.photos/seed/p4/600/400' }
  ];
}
