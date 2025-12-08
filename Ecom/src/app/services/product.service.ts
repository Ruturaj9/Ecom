// src/app/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  uploadSliderImages(files: File[]): Observable<{ urls: { desktop: string; mobile: string }[] }> {
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

  // <-- NEW: paginated public products (supports optional query params)
  getPublicProductsPaginated(params: {
    page?: number;
    limit?: number;
    q?: string;
    category?: string;
    sort?: 'low-high' | 'high-low' | 'none';
  }): Observable<any> {
    const p = params || {};
    const page = p.page ?? 1;
    const limit = p.limit ?? 24;
    const q = p.q ? `&q=${encodeURIComponent(p.q)}` : '';
    const category = p.category && p.category !== 'All' ? `&category=${encodeURIComponent(p.category)}` : '';
    const sort = p.sort && p.sort !== 'none' ? `&sort=${encodeURIComponent(p.sort)}` : '';

    const url = `${this.basePublic}/products?page=${page}&limit=${limit}${q}${category}${sort}`;
    return this.http.get<any>(url);
  }

  getSlidersPublic(): Observable<{ sliders: any[] }> {
    return this.http.get<{ sliders: any[] }>(
      `${this.basePublic}/sliders`
    );
  }

  getPublicProducts(): Observable<{ products: any[] }> {
    return this.http.get<{ products: any[] }>(
      `${this.basePublic}/products`
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
