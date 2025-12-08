// src/app/pages/admin/product-list/product-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  loading = true;
  errorMessage = '';

  // Pagination state
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;

  // Allow Math in template
  Math = Math;

  constructor(private productSvc: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.errorMessage = '';

    this.productSvc.getProductsPaginated(this.page, this.limit).subscribe({
      next: (res: any) => {
        console.log('PRODUCT PAGINATED RESPONSE:', res);

        this.products = res.products ?? [];
        this.total = res.total ?? 0;
        this.totalPages = res.totalPages ?? 1;

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.products = [];
        this.errorMessage = err?.error?.message || 'Failed to load products';
        this.loading = false;
      }
    });
  }

  // Pagination helper — generates [1,2,3,...]
  pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
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

  editProduct(id: string) {
    alert('Edit product coming soon: ' + id);
  }

  deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return;

    this.productSvc.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p._id !== id);
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.errorMessage = err?.error?.message || 'Failed to delete product';
      }
    });
  }
}
