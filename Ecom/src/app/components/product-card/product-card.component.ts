import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule           // <-- Required for routerLink
  ],
  templateUrl: './product-card.component.html'
})
export class ProductCardComponent {
  @Input() product: any = null;
}
