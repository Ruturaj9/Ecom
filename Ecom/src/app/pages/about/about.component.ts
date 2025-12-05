import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AboutSectionComponent } from './about-section.component';
import { ServicesSectionComponent } from './services-section.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, AboutSectionComponent, ServicesSectionComponent],
  templateUrl: './about.component.html'
})
export class AboutComponent implements AfterViewInit {

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngAfterViewInit() {
    // Force re-navigation even if clicking the same fragment again
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    setTimeout(() => {
      this.route.fragment.subscribe(fragment => {

        // compute full navbar height (both rows)
        const navEl = document.querySelector('nav');
        const navHeight = navEl ? navEl.getBoundingClientRect().height : 0;

        const extraGap = 20;   // breathing space
        const fullOffset = navHeight + extraGap; // actual offset

        if (!fragment) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        const el = document.getElementById(fragment);
        if (el) {
          const rect = el.getBoundingClientRect();
          const absolute = window.pageYOffset + rect.top;
          const target = absolute - fullOffset;

          window.scrollTo({ top: target, behavior: 'smooth' });
        }
      });
    }, 50);  // slightly larger delay for layout
  }
}
