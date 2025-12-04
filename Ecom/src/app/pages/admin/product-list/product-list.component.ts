import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {

  products: any[] = [];

  constructor(private productSvc: ProductService) {}

  ngOnInit() {
    this.productSvc.getProducts().subscribe({
      next: (res: any) => {
        this.products = res.products;
      },
      error: err => console.error(err)
    });
  }

  editProduct(id: string) {
    alert("Edit product coming soon: " + id);
  }

  deleteProduct(id: string) {
    if (!confirm("Delete product?")) return;

    this.productSvc.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p._id !== id);
      },
      error: err => console.error(err)
    });
  }
}
