import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cart: any[] = [];

  constructor() {
    const saved = localStorage.getItem('cart');
    if (saved) {
      this.cart = JSON.parse(saved);
    }
  }

  getCart() {
    return this.cart;
  }

  saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }

  addToCart(product: any) {
    const existing = this.cart.find(item => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({
        ...product,
        quantity: 1
      });
    }

    this.saveCart();
  }

  removeFromCart(id: number) {
    this.cart = this.cart.filter(item => item.id !== id);
    this.saveCart();
  }

  increaseQty(id: number) {
    const item = this.cart.find(i => i.id === id);
    if (item) {
      item.quantity += 1;
      this.saveCart();
    }
  }

  decreaseQty(id: number) {
    const item = this.cart.find(i => i.id === id);
    if (item && item.quantity > 1) {
      item.quantity -= 1;
      this.saveCart();
    }
  }

  clearCart() {
    this.cart = [];
    localStorage.removeItem('cart');
  }

  getTotal() {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
