// src/app/components/product-card/product-card.component.ts
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html'
})
export class ProductCardComponent {
  @Input() product: any = null;

  router = inject(Router);

  goToDetail(e?: Event) {
    e?.stopPropagation();
    if (!this.product) return;

    const id = this.product._id || this.product.id;
    if (id) {
      this.router.navigate(['/products', id]);
    }
  }
}
