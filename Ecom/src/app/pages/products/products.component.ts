// src/app/pages/products/products.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './products.component.html'
})
export class ProductsComponent implements OnInit {

  // Filters
  searchText = '';
  selectedCategory: string = 'All';
  sortBy: 'none' | 'low-high' | 'high-low' = 'none';

  categories: string[] = ['All'];

  // Products data
  products: any[] = [];

  // Pagination state
  page = 1;
  limit = 12;
  total = 0;
  totalPages = 1;

  loading = true;
  errorMessage = '';
  Math = Math; // for template usage

  constructor(private productSvc: ProductService) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  // --------------------------
  // LOAD CATEGORIES FROM BACKEND
  // --------------------------
  loadCategories() {
    this.productSvc.getPublicProducts().subscribe({
      next: (res) => {
        const allProducts = res.products ?? [];
        const set = new Set(allProducts.map(p => p.category?.name).filter(Boolean));
        this.categories = ['All', ...Array.from(set)];
      },
      error: () => {
        console.warn("Could not load categories (public API)");
      }
    });
  }

  // --------------------------
  // LOAD PRODUCTS WITH PAGINATION
  // --------------------------
  loadProducts() {
    this.loading = true;
    this.errorMessage = '';

    const params = {
      page: this.page,
      limit: this.limit,
      q: this.searchText || undefined,
      category: this.selectedCategory !== 'All' ? this.selectedCategory : undefined,
      sort: this.sortBy as 'none' | 'low-high' | 'high-low'
    };

    this.productSvc.getPublicProductsPaginated(params).subscribe({
      next: (res: any) => {
        this.products = res.products ?? [];
        this.total = res.total ?? 0;
        this.totalPages = res.totalPages ?? 1;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Failed to load products.';
      }
    });
  }

  // --------------------------
  // PAGINATION METHODS
  // --------------------------
  pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(num: number) {
    if (num < 1 || num > this.totalPages) return;
    this.page = num;
    this.loadProducts();
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

  // --------------------------
  // FILTER CHANGE TRIGGER
  // --------------------------
  onFilterChanged() {
    this.page = 1;
    this.loadProducts();
  }
}
