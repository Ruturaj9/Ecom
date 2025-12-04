import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-slider-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slider-list.component.html'
})
export class SliderListComponent implements OnInit {

  sliders: any[] = [];

  constructor(private productSvc: ProductService) {}

  ngOnInit() {
    this.productSvc.getSliders().subscribe({
      next: (res: any) => {
        this.sliders = res.sliders;
      },
      error: err => console.error(err)
    });
  }

  deleteSlider(id: string) {
    if (!confirm("Delete slider?")) return;

    this.productSvc.deleteSlider(id).subscribe({
      next: () => {
        this.sliders = this.sliders.filter(s => s._id !== id);
      },
      error: err => console.error(err)
    });
  }
}
