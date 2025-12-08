// src/app/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {

  private baseAdmin = 'http://localhost:4000/admin';
  private basePublic = 'http://localhost:4000';

  constructor(private http: HttpClient) {}

  // ===========================
  // PRODUCT CRUD (ADMIN)
  // ===========================

  createProduct(payload: any): Observable<any> {
    return this.http.post(
      `${this.baseAdmin}/products`,
      payload,
      { withCredentials: true }
    );
  }

  getProductsPaginated(page: number, limit: number): Observable<any> {
    return this.http.get(
      `${this.baseAdmin}/products?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
  }

  getProducts(): Observable<any> {
    return this.http.get(
      `${this.baseAdmin}/products`,
      { withCredentials: true }
    );
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(
      `${this.baseAdmin}/products/${id}`,
      { withCredentials: true }
    );
  }

  // ===========================
  // PRODUCT IMAGE UPLOAD
  // ===========================

  uploadImages(files: File[]): Observable<{ urls: string[] }> {
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));

    return this.http.post<{ urls: string[] }>(
      `${this.baseAdmin}/upload/images`,
      fd,
      { withCredentials: true }
    );
  }

  // ===========================
  // SLIDER IMAGE UPLOAD
  // ===========================

  uploadSliderImages(
    files: File[]
  ): Observable<{ urls: { desktop: string; mobile: string }[] }> {
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));

    return this.http.post<{ urls: { desktop: string; mobile: string }[] }>(
      `${this.baseAdmin}/slider/upload`,
      fd,
      { withCredentials: true }
    );
  }

  // ===========================
  // SLIDER CRUD (ADMIN)
  // ===========================

  createSliders(sliders: any[]): Observable<any> {
    return this.http.post(
      `${this.baseAdmin}/slider`,
      { sliders },
      { withCredentials: true }
    );
  }

  getSliders(): Observable<any> {
    return this.http.get(
      `${this.baseAdmin}/slider`,
      { withCredentials: true }
    );
  }

  deleteSlider(id: string): Observable<any> {
    return this.http.delete(
      `${this.baseAdmin}/slider/${id}`,
      { withCredentials: true }
    );
  }

  // ===========================
  // PUBLIC ENDPOINTS
  // ===========================

  // ⭐ Server-side paginated public products
  getPublicProductsPaginated(params: {
    page?: number;
    limit?: number;
    q?: string;
    category?: string;
    sort?: 'low-high' | 'high-low' | 'none';
  }): Observable<any> {

    let httpParams = new HttpParams()
      .set('page', params.page ?? 1)
      .set('limit', params.limit ?? 24);

    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    if (params.category) {
      httpParams = httpParams.set('category', params.category);
    }

    if (params.sort && params.sort !== 'none') {
      httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<any>(`${this.basePublic}/products`, { params: httpParams });
  }

  // ⭐ Get all (legacy)
  getPublicProducts(): Observable<{ products: any[] }> {
    return this.http.get<{ products: any[] }>(
      `${this.basePublic}/products`
    );
  }

  // ⭐ Get a single product
  getPublicProduct(id: string): Observable<{ product: any }> {
    return this.http.get<{ product: any }>(
      `${this.basePublic}/products/${id}`
    );
  }

  // Returns homepage sliders (public)
getSlidersPublic(): Observable<{ sliders: any[] }> {
  return this.http.get<{ sliders: any[] }>(
    `${this.basePublic}/sliders`
  );
}

  // ⭐ NEW → Get categories for frontend dropdown
  getPublicCategories(): Observable<{ categories: any[] }> {
    return this.http.get<{ categories: any[] }>(
      `${this.basePublic}/products/categories`
    );
  }

  // ===========================
  // CATEGORY CRUD (ADMIN)
  // ===========================

  getCategories(): Observable<any> {
    return this.http.get(
      `${this.baseAdmin}/categories`,
      { withCredentials: true }
    );
  }

  createCategory(payload: any): Observable<any> {
    return this.http.post(
      `${this.baseAdmin}/categories`,
      payload,
      { withCredentials: true }
    );
  }
}
