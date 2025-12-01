import { Component, Input } from '@angular/core';
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

  constructor(private router: Router) {}

  goToDetail(event?: MouseEvent) {
    if (event) event.stopPropagation();
    if (this.product?.id != null) {
      this.router.navigate(['/products', this.product.id]);
    }
  }
}
