import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './products.component.html'
})
export class ProductsComponent {

  searchText = '';
  selectedCategory: string = 'All';
  sortBy = 'none';

  categories = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Pulses', 'Seeds'];

  products = [
    { id: 1, title: 'Potatoes', price: 22, category: 'Vegetables', location: 'Pune', image: 'https://picsum.photos/seed/p1/600/400' },
    { id: 2, title: 'Tomatoes', price: 40, category: 'Vegetables', location: 'Nashik', image: 'https://picsum.photos/seed/p2/600/400' },
    { id: 3, title: 'Onions', price: 35, category: 'Vegetables', location: 'Solapur', image: 'https://picsum.photos/seed/p3/600/400' },
    { id: 4, title: 'Banana', price: 55, category: 'Fruits', location: 'Satara', image: 'https://picsum.photos/seed/p4/600/400' },
    { id: 5, title: 'Wheat', price: 30, category: 'Grains', location: 'Kolhapur', image: 'https://picsum.photos/seed/p5/600/400' },
    { id: 6, title: 'Milk', price: 50, category: 'Dairy', location: 'Nagpur', image: 'https://picsum.photos/seed/p6/600/400' },
    { id: 7, title: 'Tur Dal', price: 110, category: 'Pulses', location: 'Mumbai', image: 'https://picsum.photos/seed/p7/600/400' },
    { id: 8, title: 'Sunflower Seeds', price: 80, category: 'Seeds', location: 'Thane', image: 'https://picsum.photos/seed/p8/600/400' },
  ];

  constructor(private route: ActivatedRoute) {
    // read category from query params and apply as filter (if present)
    this.route.queryParams.subscribe(params => {
      const cat = params['category'];
      if (cat && this.categories.includes(cat)) {
        this.selectedCategory = cat;
      } else {
        this.selectedCategory = 'All';
      }
      // optional: if you want to prefill searchText from query param:
      // this.searchText = params['q'] || '';
    });
  }

  get filteredProducts() {
    // copy to avoid mutating original array when sorting
    let filtered = this.products.filter(p =>
      p.title.toLowerCase().includes(this.searchText.toLowerCase())
    );

    if (this.selectedCategory && this.selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    // perform sort on a copy
    if (this.sortBy === 'low-high') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'high-low') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  }
}
