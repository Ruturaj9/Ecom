import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AboutSectionComponent } from './about-section.component';
import { ServicesSectionComponent } from './services-section.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, AboutSectionComponent, ServicesSectionComponent],
  templateUrl: './about.component.html'
})
export class AboutComponent implements AfterViewInit {
  constructor(private route: ActivatedRoute) {}

  ngAfterViewInit() {
    // Subscribe to fragment changes (clicking links with fragment or direct URL with #)
    // Use a small timeout to ensure DOM has rendered.
    setTimeout(() => {
      this.route.fragment.subscribe(fragment => {
        // compute navbar height dynamically (handles different screen sizes)
        const navEl = document.querySelector('nav');
        const navHeight = navEl ? Math.ceil(navEl.getBoundingClientRect().height) : 0;
        const extraGap = 10; // a little breathing room so heading isn't flush to nav

        // If no fragment, scroll to top of page (just below navbar)
        if (!fragment) {
          // scroll to top but leave navbar height offset
          window.scrollTo({ top: Math.max(0, 0 - navHeight + extraGap), behavior: 'smooth' });
          return;
        }

        // Scroll to the element ID manually with offset
        const el = document.getElementById(fragment);
        if (el) {
          // Element's position relative to the document
          const rect = el.getBoundingClientRect();
          const absoluteTop = window.pageYOffset + rect.top;
          const target = Math.max(0, absoluteTop - navHeight - extraGap);

          window.scrollTo({ top: target, behavior: 'smooth' });
        } else {
          // fallback: let browser try native fragment scroll then adjust a little later
          setTimeout(() => {
            const e = document.getElementById(fragment);
            if (e) {
              const r = e.getBoundingClientRect();
              const aTop = window.pageYOffset + r.top;
              const t = Math.max(0, aTop - navHeight - extraGap);
              window.scrollTo({ top: t, behavior: 'smooth' });
            }
          }, 60);
        }
      });
    }, 0);
  }
}
