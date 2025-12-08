import { Injectable } from '@angular/core';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cart: CartItem[] = [];

  constructor() {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        this.cart = JSON.parse(saved);
      } catch {
        this.cart = [];
      }
    }
  }

  // ================================================
  // GET CART
  // ================================================
  getCart(): CartItem[] {
    return this.cart;
  }

  private saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }

  // ================================================
  // ADD TO CART ( FIXED IMAGE + FIXED ID )
  // ================================================
  addToCart(product: any) {
    const id = product._id || product.id;

    const image =
      product.images?.[0] ||
      product.imageUrl?.desktop ||
      product.imageUrl?.mobile ||
      product.imageUrl ||
      'https://via.placeholder.com/600x400?text=No+Image';

    const existing = this.cart.find(item => item.id === id);

    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({
        id,
        title: product.title,
        price: product.price,
        image,
        quantity: 1
      });
    }

    this.saveCart();
  }

  // ================================================
  // REMOVE ITEM
  // ================================================
  removeFromCart(id: string | number) {
    this.cart = this.cart.filter(item => item.id !== id);
    this.saveCart();
  }

  // ================================================
  // QUANTITY CONTROLS
  // ================================================
  increaseQty(id: string | number) {
    const item = this.cart.find(i => i.id === id);
    if (item) {
      item.quantity++;
      this.saveCart();
    }
  }

  decreaseQty(id: string | number) {
    const item = this.cart.find(i => i.id === id);
    if (item && item.quantity > 1) {
      item.quantity--;
      this.saveCart();
    }
  }

  // ================================================
  // CLEAR CART
  // ================================================
  clearCart() {
    this.cart = [];
    localStorage.removeItem('cart');
  }

  // ================================================
  // CART TOTAL
  // ================================================
  getTotal(): number {
    return this.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }
}
