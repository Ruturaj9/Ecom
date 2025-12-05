import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RetailSectionComponent } from './retail-section.component';
import { ContactSectionComponent } from './contact-section.component';

@Component({
  selector: 'app-retail-services',
  standalone: true,
  imports: [CommonModule, RetailSectionComponent, ContactSectionComponent],
  templateUrl: './retail-services.component.html'
})
export class RetailServicesComponent implements AfterViewInit {

  constructor(private route: ActivatedRoute) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.route.fragment.subscribe(fragment => {

        // dynamic navbar height fix
        const nav = document.querySelector('nav');
        const navHeight = nav ? nav.getBoundingClientRect().height : 0;
        const gap = 10;

        // no fragment = scroll to top ALWAYS
        if (!fragment) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        const el = document.getElementById(fragment);
        if (el) {
          const rect = el.getBoundingClientRect();
          const absoluteTop = window.pageYOffset + rect.top;
          const target = absoluteTop - navHeight - gap;

          window.scrollTo({ top: target, behavior: 'smooth' });
        }
      });
    }, 0);
  }

}
