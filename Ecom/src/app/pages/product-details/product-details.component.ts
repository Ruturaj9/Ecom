// src/app/pages/product-details/product-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './product-details.component.html'
})
export class ProductDetailsComponent implements OnInit {

  product: any = null;
  similarProducts: any[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private productSvc: ProductService,
    private cart: CartService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;
      this.loadProduct(id);
    });
  }

  // -----------------------------------------
  // LOAD MAIN PRODUCT
  // -----------------------------------------
  loadProduct(id: string) {
    this.loading = true;
    this.errorMessage = '';

    this.productSvc.getPublicProduct(id).subscribe({
      next: (res) => {
        this.product = res?.product || null;

        if (!this.product) {
          this.loading = false;
          this.errorMessage = 'Product not found.';
          return;
        }

        // Load similar products AFTER product is known
        this.loadSimilarProducts(this.product);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Failed to load product.';
      }
    });
  }

  // -----------------------------------------
  // LOAD SIMILAR PRODUCTS (same category)
  // -----------------------------------------
  loadSimilarProducts(product: any) {
    const categoryName = product.category?.name;
    if (!categoryName) {
      this.loading = false;
      this.similarProducts = [];
      return;
    }

    this.productSvc
      .getPublicProductsPaginated({
        page: 1,
        limit: 12,
        category: categoryName
      })
      .subscribe({
        next: (res) => {
          const list = res.products || [];

          // remove current product
          this.similarProducts =
            list.filter((p: any) => p._id !== product._id).slice(0, 8);

          this.loading = false;
        },
        error: () => {
          this.similarProducts = [];
          this.loading = false;
        }
      });
  }

  // -----------------------------------------
  // CART ACTION
  // -----------------------------------------
  addToCart() {
    if (!this.product) return;
    this.cart.addToCart(this.product);
    alert('Added to cart!');
  }
}
