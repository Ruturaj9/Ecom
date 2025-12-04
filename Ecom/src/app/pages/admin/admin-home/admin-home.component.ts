import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-admin-home',
  template: `
    <h1 class="text-2xl font-bold">Welcome Admin 👋</h1>
    <p class="mt-2 text-gray-600">Use the sidebar to manage products, sliders, and logs.</p>
  `,
  imports: [CommonModule]
})
export class AdminHomeComponent {}
