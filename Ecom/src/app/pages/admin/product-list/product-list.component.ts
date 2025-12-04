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
  errorMessage = ''; // <-- added

  constructor(private productSvc: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts() {
    this.loading = true;
    this.errorMessage = '';

    this.productSvc.getProducts().subscribe({
      next: (res: any) => {
        console.log('API RAW RESPONSE:', res);

        // Defensive normalization:
        if (Array.isArray(res)) {
          this.products = res;
        } else {
          this.products = res?.products ?? res?.data ?? [];
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.products = [];
        this.errorMessage = (err?.error?.message) || 'Failed to load products';
        this.loading = false;
      }
    });
  }

  editProduct(id: string) {
    alert('Edit product coming soon: ' + id);
  }

  deleteProduct(id: string) {
    if (!confirm('Delete product?')) return;

    this.productSvc.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p._id !== id);
      },
      error: (err) => {
        console.error('Failed to delete product', err);
        this.errorMessage = (err?.error?.message) || 'Failed to delete product';
      }
    });
  }

  // <-- added trackBy helper
  trackById(index: number, item: any) {
    return item?._id ?? index;
  }
}
