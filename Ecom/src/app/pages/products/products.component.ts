import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './products.component.html'
})
export class ProductsComponent {

  searchText = '';
  selectedCategory = 'All';
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

  get filteredProducts() {
    let filtered = this.products.filter(p =>
      p.title.toLowerCase().includes(this.searchText.toLowerCase())
    );

    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    if (this.sortBy === 'low-high') {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'high-low') {
      filtered = filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }
}
