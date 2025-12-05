import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-retail-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './retail-section.component.html',
  styles: [`
    @keyframes fadeIn {
      from { opacity:0; transform: translateY(20px); }
      to { opacity:1; transform: translateY(0); }
    }
    .fadeIn { animation: fadeIn .9s ease-out forwards; }
    .card { background:white; border-radius:1rem; padding:1.5rem; box-shadow:0 4px 15px rgba(0,0,0,.08); }
    .card:hover { transform: translateY(-5px); transition:.2s; }
  `]
})
export class RetailSectionComponent {}
