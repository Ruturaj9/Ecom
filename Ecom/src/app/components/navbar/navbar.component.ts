import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  mobileOpen = false;

  // Dropdown categories
  categories = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Pulses', 'Seeds'];

  // Search text bound to input
  searchText = '';

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

  // Trigger search: navigate to /products?q=searchText
  doSearch() {
    const q = (this.searchText || '').trim();
    this.mobileOpen = false;
    // use query param 'q' so products page can read it
    this.router.navigate(['/products'], { queryParams: { q } });
  }

  // optional helper to clear search
  clearSearch() {
    this.searchText = '';
  }
}
