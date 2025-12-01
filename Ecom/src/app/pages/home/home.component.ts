import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnDestroy {

  currentSlide = 0;

  /* PREMIUM SLIDER IMAGES */
  offerImages = [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1511689988353-3a2f5be94cd6?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=1600&q=80"
  ];

  private timer: any;

  constructor(private cdr: ChangeDetectorRef) {
    this.startAutoSlide();
  }

  /* AUTO SLIDER FIXED FOR ANGULAR 21 */
  startAutoSlide() {
    this.stopAutoSlide();
    this.timer = setInterval(() => {
      this.next();
    }, 5000);
  }

  stopAutoSlide() {
    if (this.timer) clearInterval(this.timer);
  }

  next() {
    this.currentSlide = (this.currentSlide + 1) % this.offerImages.length;
    this.cdr.markForCheck();
  }

  prev() {
    this.currentSlide =
      (this.currentSlide - 1 + this.offerImages.length) %
      this.offerImages.length;
    this.cdr.markForCheck();
  }

  goTo(i: number) {
    this.currentSlide = i;
    this.startAutoSlide();
    this.cdr.markForCheck();
  }

  /* SWIPE SUPPORT */
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

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  /* CATEGORY LIST */
  categories = [
    { id: 1, name: 'Vegetables', icon: '🥕' },
    { id: 2, name: 'Fruits', icon: '🍎' },
    { id: 3, name: 'Grains', icon: '🌾' },
    { id: 4, name: 'Dairy', icon: '🧀' },
    { id: 5, name: 'Pulses', icon: '🫘' },
    { id: 6, name: 'Seeds', icon: '🌱' }
  ];

  /* FEATURED PRODUCTS */
  featured = [
    { id: 1, title: 'Potatoes', price: 22, location: 'Pune', image: 'https://picsum.photos/seed/p1/600/400' },
    { id: 2, title: 'Tomatoes', price: 40, location: 'Nashik', image: 'https://picsum.photos/seed/p2/600/400' },
    { id: 3, title: 'Onions', price: 35, location: 'Solapur', image: 'https://picsum.photos/seed/p3/600/400' },
    { id: 4, title: 'Banana', price: 55, location: 'Satara', image: 'https://picsum.photos/seed/p4/600/400' }
  ];
}
