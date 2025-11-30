import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  mobileOpen = false;

  constructor(public cart: CartService) {}

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  get cartCount() {
    return this.cart.getCart().reduce((sum, item) => sum + item.quantity, 0);
  }
}

