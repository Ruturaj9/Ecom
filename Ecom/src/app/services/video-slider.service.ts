import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VideoSliderService {

  private readonly API = 'http://localhost:4000/admin';

  constructor(private http: HttpClient) {}

  /**
   * Save video slider metadata
   * Calls backend: POST /admin/video-sliders
   */
  createVideoSliders(videos: any[]): Observable<any> {
    return this.http.post(
      this.API,
      { videos },
      { withCredentials: true }
    );
  }
  getAdminList(page = 1, limit = 8): Observable<any> {
    return this.http.get(this.API, {
      params: { page, limit },
      withCredentials: true,
    });
  }

  toggleActive(id: string, active: boolean): Observable<any> {
    return this.http.put(
      `${this.API}/${id}`,
      { active },
      { withCredentials: true }
    );
  }

  delete(id: string): Observable<any> {
    return this.http.delete(
      `${this.API}/${id}`,
      { withCredentials: true }
    );
  }
}
