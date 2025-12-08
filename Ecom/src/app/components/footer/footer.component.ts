import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  year = new Date().getFullYear();

  constructor(private router: Router) {}

  navigateTop(path: string) {
    this.router.navigate([path], {
      fragment: undefined,
      skipLocationChange: true
    }).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  navigate(path: string, fragment: string) {
    this.router.navigate([path], {
      fragment: undefined,
      skipLocationChange: true
    }).then(() => {
      this.router.navigate([path], { fragment });
    });
  }
}
