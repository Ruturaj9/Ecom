import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  // expose a property for the template to read (Angular templates can't call `new` directly)
  year = new Date().getFullYear();
}
