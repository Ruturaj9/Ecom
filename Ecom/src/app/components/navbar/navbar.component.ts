import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  mobileOpen = false;

  // Dropdown categories
  categories = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Pulses', 'Seeds'];

  constructor(public cart: CartService, private router: Router) {}

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  get cartCount() {
    return this.cart.getCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  // Navigate to products page with category filter
  goToCategory(category: string) {
    this.mobileOpen = false;
    this.router.navigate(['/products'], { queryParams: { category } });
  }
}
