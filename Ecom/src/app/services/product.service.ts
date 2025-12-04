import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = 'http://localhost:4000';

  constructor(private http: HttpClient) {}

  // ---------------------------------------------
  // PRODUCT IMAGE UPLOAD (PRODUCT UPLOADER PAGE)
  // ---------------------------------------------
  uploadImages(files: File[]) {
    const fd = new FormData();
    files.forEach(f => fd.append('images', f)); // backend expects "images"

    return this.http.post<{ urls: string[] }>(
      `${this.base}/admin/upload/images`,
      fd,
      { withCredentials: true }
    );
  }

  // ---------------------------------------------
  // CREATE PRODUCT
  // ---------------------------------------------
  createProduct(payload: any) {
    return this.http.post(
      `${this.base}/admin/products`,
      payload,
      { withCredentials: true }
    );
  }

  // ============================================================
  //  SLIDER UPLOAD & MANAGEMENT
  // ============================================================

  // ---------------------------------------------
  // Upload images for SLIDER (Cloudinary)
  // ---------------------------------------------
  uploadSliderImages(files: File[]) {
    const fd = new FormData();
    files.forEach(f => fd.append('images', f)); // backend expects "images"

    return this.http.post<{ urls: string[] }>(
      `${this.base}/admin/slider/upload-images`,
      fd,
      { withCredentials: true }
    );
  }

  // ---------------------------------------------
  // SAVE SLIDER (title, subtitle, button, order)
  // ---------------------------------------------
  saveSlider(payload: any[]) {
    return this.http.post(
      `${this.base}/admin/slider`,
      payload,
      { withCredentials: true }
    );
  }

  // ---------------------------------------------
  // GET SLIDER (for homepage or admin list)
  // ---------------------------------------------
  getSlider(): Observable<any> {
    return this.http.get(
      `${this.base}/slider`,
      { withCredentials: true }
    );
  }

  // ---------------------------------------------
  // DELETE SLIDE
  // ---------------------------------------------
  deleteSlide(id: string) {
    return this.http.delete(
      `${this.base}/admin/slider/${id}`,
      { withCredentials: true }
    );
  }

  // ---------------------------------------------
  // UPDATE SLIDE ORDER (drag & drop save)
  // ---------------------------------------------
  updateSlideOrder(slides: any[]) {
    return this.http.put(
      `${this.base}/admin/slider/reorder`,
      { slides },
      { withCredentials: true }
    );
  }
}
