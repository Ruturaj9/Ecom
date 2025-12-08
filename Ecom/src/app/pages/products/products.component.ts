// src/app/pages/products/products.component.ts
import { Component, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './products.component.html',
})
export class ProductsComponent {

  private productSvc = inject(ProductService);

  // Expose Math to the template
  Math = Math;

  // ----------------------------
  // SIGNAL STATE
  // ----------------------------
  searchText = signal('');
  selectedCategory = signal<string>('All');
  sortBy = signal<'none' | 'low-high' | 'high-low'>('none');

  categories = signal<string[]>(['All']);
  products = signal<any[]>([]);

  // Pagination signals
  page = signal(1);
  limit = signal(24);
  total = signal(0);
  totalPages = signal(1);

  // System state
  loading = signal(true);
  errorMessage = signal('');

  // ----------------------------
  // COMPUTED PAGINATION PAGES
  // ----------------------------
  pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  // ----------------------------
  // AUTO-REFRESH EFFECT
  // ----------------------------
  constructor() {
    this.loadCategories();

    effect(() => {
      this.page();
      this.searchText();
      this.selectedCategory();
      this.sortBy();
      this.loadProducts();
    });
  }

  // ----------------------------
  // LOAD CATEGORIES
  // ----------------------------
  loadCategories() {
    this.productSvc.getPublicCategories().subscribe({
      next: (res) => {
        const list = res?.categories || [];
        this.categories.set(['All', ...list.map((c: any) => c.name)]);
      },
      error: () => {
        console.warn('Failed to load categories');
      }
    });
  }

  // ----------------------------
  // LOAD PRODUCTS
  // ----------------------------
  loadProducts() {
    this.loading.set(true);
    this.errorMessage.set('');

    const params = {
      page: this.page(),
      limit: this.limit(),
      q: this.searchText() || undefined,
      category:
        this.selectedCategory() !== 'All'
          ? this.selectedCategory()
          : undefined,
      sort: this.sortBy(),
    };

    this.productSvc.getPublicProductsPaginated(params).subscribe({
      next: (res) => {
        this.products.set(res.products || []);
        this.total.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Unable to load products at the moment.');
      },
    });
  }

  // ----------------------------
  // FILTER CHANGE + reset page
  // ----------------------------
  onFilterChanged() {
    this.page.set(1);
  }

  // ----------------------------
  // PAGINATION
  // ----------------------------
  goToPage(num: number) {
    if (num >= 1 && num <= this.totalPages()) {
      this.page.set(num);
    }
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update(v => v + 1);
    }
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update(v => v - 1);
    }
  }
}
