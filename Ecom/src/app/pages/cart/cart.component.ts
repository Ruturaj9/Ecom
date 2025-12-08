import { Component, computed, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html'
})
export class CartComponent {

  // Local reactive signal mirror of cart
  cartItems = signal<any[]>([]);

  constructor(private cartSvc: CartService) {
    this.refreshCart();
  }

  // Pull latest cart from service into signal
  refreshCart() {
    this.cartItems.set([...this.cartSvc.getCart()]);
  }

  // ✔ REQUIRED: Fixes template error
  isEmpty(): boolean {
    return this.cartItems().length === 0;
  }

  // ✔ REQUIRED: Fixes template error
  total(): number {
    return this.cartSvc.getTotal();
  }

  increase(id: string | number) {
    this.cartSvc.increaseQty(id);
    this.refreshCart();
  }

  decrease(id: string | number) {
    this.cartSvc.decreaseQty(id);
    this.refreshCart();
  }

  remove(id: string | number) {
    this.cartSvc.removeFromCart(id);
    this.refreshCart();
  }
}
