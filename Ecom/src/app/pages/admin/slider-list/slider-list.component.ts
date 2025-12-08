import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-slider-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slider-list.component.html',
})
export class SliderListComponent implements OnInit {

  sliders = signal<any[]>([]);
  loading = signal(true);
  error = signal('');

  constructor(private productSvc: ProductService) {}

  ngOnInit() {
    this.loadSliders();
  }

  loadSliders() {
    this.loading.set(true);
    this.productSvc.getSliders().subscribe({
      next: (res: any) => {
        this.sliders.set(res.sliders || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load sliders.');
        this.loading.set(false);
      }
    });
  }

  /** ------------------------------
   *  TOGGLE ACTIVE / INACTIVE
   * ------------------------------ */
  toggleActive(slider: any) {
    const updated = { active: !slider.active };

    this.productSvc.updateSlider(slider._id, updated).subscribe({
      next: () => {
        this.sliders.update(list =>
          list.map(s =>
            s._id === slider._id ? { ...s, active: updated.active } : s
          )
        );
      },
      error: err => {
        console.error(err);
        alert("Failed to update slider status");
      }
    });
  }

  /** ------------------------------
   *  DELETE SLIDER
   * ------------------------------ */
  deleteSlider(id: string) {
    if (!confirm("Delete slider?")) return;

    this.productSvc.deleteSlider(id).subscribe({
      next: () => {
        this.sliders.update(list => list.filter(s => s._id !== id));
      },
      error: err => {
        console.error(err);
        alert("Failed to delete slider");
      }
    });
  }
}
