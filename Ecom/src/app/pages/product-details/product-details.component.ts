import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './product-details.component.html'
})
export class ProductDetailsComponent {

  product: any = null;

  allProducts = [
    { id: 1, title: 'Potatoes', price: 22, category: 'Vegetables', location: 'Pune', image: 'https://picsum.photos/seed/p1/600/400' },
    { id: 2, title: 'Tomatoes', price: 40, category: 'Vegetables', location: 'Nashik', image: 'https://picsum.photos/seed/p2/600/400' },
    { id: 3, title: 'Onions', price: 35, category: 'Vegetables', location: 'Solapur', image: 'https://picsum.photos/seed/p3/600/400' },
    { id: 4, title: 'Banana', price: 55, category: 'Fruits', location: 'Satara', image: 'httpsum.photos/seed/p4/600/400' }
  ];

  constructor(
    private route: ActivatedRoute,
    private cart: CartService
  ) {}

  // FIX: React to ID changes without reload
  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.product = this.allProducts.find(p => p.id === id);
    });
  }

  addToCart() {
    this.cart.addToCart(this.product);
    alert('Added to cart!');
  }
}
