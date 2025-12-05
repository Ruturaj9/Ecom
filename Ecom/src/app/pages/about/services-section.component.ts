import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-services-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services-section.component.html',
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fadeIn { animation: fadeIn 0.9s ease-out forwards; }

    /* small responsive tweak for partner logos */
    .partner-logo { height: 56px; width: auto; object-fit: contain; }

    /* subtle card hover */
    .card-hover:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
    .card-hover { transition: transform .18s ease, box-shadow .18s ease; }

    /* category list bullets alignment */
    .category-list li { margin-top: .45rem; }
  `]
})
export class ServicesSectionComponent {}
