// src/app/pages/products/products.component.ts
import {
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';

import { ScrollingModule } from '@angular/cdk/scrolling';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductCardComponent,
    ScrollingModule
  ],
  templateUrl: './products.component.html'
})
export class ProductsComponent implements OnInit {

  // ----------------------------
  // FILTER STATE
  // ----------------------------
  searchText = '';
  selectedCategory: string = 'All';
  sortBy: 'none' | 'low-high' | 'high-low' = 'none';

  categories: string[] = ['All'];
  products: any[] = [];

  // ----------------------------
  // PAGINATION STATE
  // ----------------------------
  page = 1;
  limit = 24;     // ideal for virtual scroll + pagination
  total = 0;
  totalPages = 1;

  // ----------------------------
  // SYSTEM STATES
  // ----------------------------
  loading = true;
  errorMessage = '';
  Math = Math;

  // Debounce search & filter
  private filterTrigger = new Subject<void>();

  constructor(private productSvc: ProductService) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();

    // Debounce 300ms for search + category change
    this.filterTrigger
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.page = 1;
        this.loadProducts();
      });
  }

  // ------------------------------------------------
  // LOAD CATEGORIES (FROM /products/categories)
  // ------------------------------------------------
  loadCategories() {
    this.productSvc.getPublicCategories().subscribe({
      next: (res: { categories: any[] }) => {
        const list = res?.categories || [];
        this.categories = ['All', ...list.map(c => c.name)];
      },
      error: (err) => {
        console.warn('Failed to load categories', err?.error || err);
      }
    });
  }

  // ------------------------------------------------
  // LOAD PRODUCTS (SERVER-SIDE PAGINATION)
  // ------------------------------------------------
  loadProducts() {
    this.loading = true;
    this.errorMessage = '';

    const params = {
      page: this.page,
      limit: this.limit,
      q: this.searchText || undefined,
      category: this.selectedCategory !== 'All' ? this.selectedCategory : undefined,
      sort: this.sortBy
    };

    this.productSvc.getPublicProductsPaginated(params).subscribe({
      next: (res: any) => {
        this.products = res.products || [];
        this.total = res.total || 0;
        this.totalPages = res.totalPages || 1;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Failed to load products.';
      }
    });
  }

  // ------------------------------------------------
  // FILTER CHANGE → Debounced refresh
  // ------------------------------------------------
  onFilterChanged() {
    this.filterTrigger.next();
  }

  // ------------------------------------------------
  // PAGINATION HELPERS
  // ------------------------------------------------
  pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(n: number) {
    if (n >= 1 && n <= this.totalPages) {
      this.page = n;
      this.loadProducts();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadProducts();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadProducts();
    }
  }
}
