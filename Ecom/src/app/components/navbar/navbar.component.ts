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

  categories = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Pulses', 'Seeds'];

  searchText = '';

  constructor(public cart: CartService, private router: Router) {}

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  get cartCount() {
    return this.cart.getCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  goToCategory(category: string) {
    this.mobileOpen = false;
    this.router.navigate(['/products'], { queryParams: { category } });
  }

  doSearch() {
    const q = (this.searchText || '').trim();
    this.mobileOpen = false;
    this.router.navigate(['/products'], { queryParams: { q } });
  }

  clearSearch() {
    this.searchText = '';
  }
}
