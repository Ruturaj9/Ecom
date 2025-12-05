import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface SliderItem {
  _id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  order: number;
}

@Injectable({ providedIn: 'root' })
export class SliderService {
  private http = inject(HttpClient);

  sliders = signal<SliderItem[]>([]);
  loading = signal(false);
  error = signal('');

  loadSliders() {
    this.loading.set(true);
    this.error.set('');

    this.http.get<{ sliders: SliderItem[] }>(`${environment.apiUrl}/slider`)
      .subscribe({
        next: (res) => {
          this.sliders.set(res.sliders);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load sliders');
          this.loading.set(false);
        }
      });
  }
}
