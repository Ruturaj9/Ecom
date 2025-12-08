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

  /** Load product + similar products */
  loadProduct(id: string) {
    this.loading = true;

    this.productSvc.getPublicProducts().subscribe({
      next: (res) => {
        const products = res.products || [];

        this.product = products.find(p => p._id === id) || null;
        this.loading = false;

        if (this.product) {
          const categoryName = this.product.category?.name;

          // Similar products (same category)
          this.similarProducts = products
            .filter(p => p._id !== id && p.category?.name === categoryName)
            .slice(0, 8); // top 8 similar
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  addToCart() {
    this.cart.addToCart(this.product);
    alert('Added to cart!');
  }
}
