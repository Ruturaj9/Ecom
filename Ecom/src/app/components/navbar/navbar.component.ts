import { Component, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  mobileOpen = false;

  categories = signal<string[]>([]);
  categoriesLoading = signal<boolean>(true);

  searchText = '';

  constructor(
    public cart: CartService,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoriesLoading.set(true);

    this.productService.getPublicCategories().subscribe({
      next: (res) => {
        const list = res?.categories?.map((c: any) => c.name) ?? [];
        this.categories.set(list);
        this.categoriesLoading.set(false);
      },
      error: () => {
        this.categories.set([]);
        this.categoriesLoading.set(false);
      },
    });
  }

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  get cartCount(): number {
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

  navigateWithFragment(path: string, fragment: string) {
    this.mobileOpen = false;

    this.router.navigate([path], { skipLocationChange: true }).then(() => {
      this.router.navigate([path], { fragment });
    });
  }

  // ⭐ NEW → Login Redirect
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
