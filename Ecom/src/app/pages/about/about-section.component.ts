import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-section.component.html',
  styles: [`
    @keyframes fadeUp {
      0% { opacity: 0; transform: translateY(24px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp .8s ease-out forwards; opacity: 0; }
    .fade-delay { animation-delay: .15s; }
  `]
})
export class AboutSectionComponent {}
