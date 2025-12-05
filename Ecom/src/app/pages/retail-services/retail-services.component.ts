import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RetailSectionComponent } from './retail-section.component';
import { ContactSectionComponent } from './contact-section.component';

@Component({
  selector: 'app-retail-services',
  standalone: true,
  imports: [CommonModule, RetailSectionComponent, ContactSectionComponent],
  templateUrl: './retail-services.component.html'
})
export class RetailServicesComponent implements AfterViewInit {

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngAfterViewInit() {
    // Force navigation even on same fragment clicks
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    setTimeout(() => {
      this.route.fragment.subscribe(fragment => {

        const navEl = document.querySelector('nav');
        const navHeight = navEl ? navEl.getBoundingClientRect().height : 0;
        const offset = navHeight + 20;

        if (!fragment) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        const el = document.getElementById(fragment);
        if (el) {
          const rect = el.getBoundingClientRect();
          const absolute = window.pageYOffset + rect.top;
          const target = absolute - offset;

          window.scrollTo({ top: target, behavior: 'smooth' });
        }
      });
    }, 50);
  }
}
