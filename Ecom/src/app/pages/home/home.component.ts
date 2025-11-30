import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {

  categories = [
    { id: 1, name: 'Vegetables', icon: '🥕' },
    { id: 2, name: 'Fruits', icon: '🍎' },
    { id: 3, name: 'Grains', icon: '🌾' },
    { id: 4, name: 'Dairy', icon: '🧀' },
    { id: 5, name: 'Pulses', icon: '🫘' },
    { id: 6, name: 'Seeds', icon: '🌱' }
  ];

  featured = [
    { id: 1, title: 'Potatoes', price: 22, location: 'Pune', image: 'https://picsum.photos/seed/p1/600/400' },
    { id: 2, title: 'Tomatoes', price: 40, location: 'Nashik', image: 'https://picsum.photos/seed/p2/600/400' },
    { id: 3, title: 'Onions', price: 35, location: 'Solapur', image: 'https://picsum.photos/seed/p3/600/400' },
    { id: 4, title: 'Banana', price: 55, location: 'Satara', image: 'https://picsum.photos/seed/p4/600/400' }
  ];
}
