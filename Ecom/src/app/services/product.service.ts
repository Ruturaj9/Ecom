import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = 'http://localhost:4000';

  constructor(private http: HttpClient) {}

  /** FIXED: Backend expects "images" field, NOT "newImages" */
  uploadImages(files: File[]): Observable<{ urls: string[] }> {
    const fd = new FormData();
    files.forEach(file => fd.append('images', file)); // MUST be "images"

    return this.http.post<{ urls: string[] }>(
      `${this.base}/admin/products/upload`,
      fd,
      { withCredentials: true }
    );
  }

  createProduct(payload: any) {
    return this.http.post(`${this.base}/admin/products`, payload, {
      withCredentials: true
    });
  }
}
