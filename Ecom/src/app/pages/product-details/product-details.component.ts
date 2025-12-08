// src/app/pages/product-details/product-details.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

type CacheEntry = { value: any; expiresAt: number };

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './product-details.component.html',
})
export class ProductDetailsComponent implements OnInit {
  // DI
  private route = inject(ActivatedRoute);
  private productSvc = inject(ProductService);
  private cart = inject(CartService);

  // SIGNAL STATE
  product = signal<any | null>(null);
  similarProducts = signal<any[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  toast = signal<string | null>(null);

  // simple in-memory cache with TTL
  private cache = new Map<string, CacheEntry>();
  private CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.loadProduct(id);
    });
  }

  // -----------------------------
  // IMAGE OPTIMIZER (Cloudinary)
  // - Inserts f_auto,q_auto and width to reduce payload
  // -----------------------------
  optimizeImage(url?: string, width = 900) {
    if (!url || typeof url !== 'string') return url || '';
    try {
      // simple heuristic: replace first '/upload/' occurrence
      const insert = `upload/w_${width},f_auto,q_auto/`;
      return url.includes('/upload/') ? url.replace('/upload/', `/${insert}`) : url;
    } catch {
      return url;
    }
  }

  // -----------------------------
  // PRELOAD IMAGE (non-blocking)
  // -----------------------------
  preload(url?: string) {
    if (!url) return;
    try {
      const img = new Image();
      img.src = this.optimizeImage(url, 1200);
      // let browser handle caching; no onload required
    } catch {}
  }

  // -----------------------------
  // CACHING HELPERS
  // -----------------------------
  private getFromCache(key: string) {
    const e = this.cache.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return e.value;
  }

  private setCache(key: string, value: any) {
    this.cache.set(key, { value, expiresAt: Date.now() + this.CACHE_TTL_MS });
  }

  // -----------------------------
  // LOAD PRODUCT (MAIN) — show UI immediately
  // -----------------------------
  loadProduct(id: string) {
    this.loading.set(true);
    this.errorMessage.set('');

    // Try cache first
    const fromCache = this.getFromCache(`product:${id}`);
    if (fromCache) {
      this.product.set(fromCache);
      this.loading.set(false);
      this.preload(fromCache.images?.[0] || fromCache.imageUrl);
      // still attempt background refresh (stale-while-revalidate)
      this.fetchProductAndUpdateCache(id, false);
      // load similar in background
      if (fromCache?.category?.name) this.loadSimilarProductsBackground(fromCache);
      return;
    }

    // No cache — fetch & show as soon as product returned
    this.fetchProductAndUpdateCache(id, true);
  }

  private fetchProductAndUpdateCache(id: string, showLoader: boolean) {
    if (showLoader) this.loading.set(true);
    this.productSvc.getPublicProduct(id).subscribe({
      next: (res) => {
        const p = res?.product || null;
        if (!p) {
          this.product.set(null);
          this.errorMessage.set('Product not found.');
          this.loading.set(false);
          return;
        }

        // set main product and cache it
        this.product.set(p);
        this.setCache(`product:${id}`, p);
        this.preload(p.images?.[0] || p.imageUrl);

        // load similar in background (non-blocking)
        if (p.category?.name) {
          // small timeout to yield UI thread
          setTimeout(() => this.loadSimilarProductsBackground(p), 20);
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.product.set(null);
        this.errorMessage.set(err?.error?.message || 'Failed to load product.');
        this.loading.set(false);
      },
    });
  }

  // -----------------------------
  // SIMILAR PRODUCTS (background)
  // - Fetches a larger page, filters out current product, returns up to 4
  // -----------------------------
  private loadSimilarProductsBackground(productObj: any) {
    const cacheKey = `similar:${productObj._id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.similarProducts.set(cached.slice(0, 4));
      // preload their images
      (cached.slice(0, 4) || []).forEach((p: any) => this.preload(p.images?.[0] || p.imageUrl));
      return;
    }

    this.productSvc.getPublicProductsPaginated({
      page: 1,
      limit: 20,
      category: productObj.category?.name
    }).subscribe({
      next: (res) => {
        const list = (res.products || [])
          .filter((p: any) => p._id !== productObj._id)
          .slice(0, 4);

        this.similarProducts.set(list);
        this.setCache(cacheKey, list);
        list.forEach((p: any) => this.preload(p.images?.[0] || p.imageUrl));
      },
      error: () => {
        this.similarProducts.set([]);
      }
    });
  }

  // -----------------------------
  // CART ACTION (non-blocking toast)
  // -----------------------------
  addToCart() {
    const p = this.product();
    if (!p) return;
    this.cart.addToCart(p);

    // Non-blocking transient toast
    this.toast.set('Added to cart');
    setTimeout(() => this.toast.set(null), 2200);
  }
}
