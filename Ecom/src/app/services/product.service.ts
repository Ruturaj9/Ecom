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
  // SLIDER UPLOAD (DESKTOP + MOBILE)
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

  saveSlider(body: any[]): Observable<any> {
    return this.createSliders(body);
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
  // PUBLIC ENDPOINTS (HOME PAGE)
  // ===========================

  /** PUBLIC – home page sliders */
  getSlidersPublic(): Observable<{ sliders: any[] }> {
    return this.http.get<{ sliders: any[] }>(
      `${this.basePublic}/sliders`
    );
  }

  /** PUBLIC – home page products */
  getPublicProducts(): Observable<{ products: any[] }> {
    return this.http.get<{ products: any[] }>(
      `${this.basePublic}/products`
    );
  }
}
