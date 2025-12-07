// src/app/services/slider.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface SliderItem {
  _id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string | { desktop: string; mobile: string };
  order: number;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class SliderService {

  private basePublic = 'http://localhost:4000';

  constructor(private http: HttpClient) {}

  sliders = signal<SliderItem[]>([]);
  loading = signal(false);
  error = signal('');

  resolveImage(item: SliderItem): string {
    if (typeof item.imageUrl === 'string') return item.imageUrl;

    return window.innerWidth < 768
      ? item.imageUrl.mobile
      : item.imageUrl.desktop;
  }

  /** Load PUBLIC sliders */
  loadSliders() {
    this.loading.set(true);
    this.error.set('');

    this.http.get<{ sliders: SliderItem[] }>(`${this.basePublic}/sliders`)
      .subscribe({
        next: res => {
          this.sliders.set(res.sliders);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load sliders.');
          this.loading.set(false);
        }
      });
  }
}
