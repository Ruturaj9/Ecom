import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterModule, NavigationEnd, Router } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    NavbarComponent,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {

  protected readonly title = signal('Ecom');

  // Inject the Angular Router
  private router = inject(Router);

  constructor() {

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {

        setTimeout(() => {
          const hash = document.location.hash;

          if (hash) {
            // If navigating to #about, #services, #contact, #top...
            const el = document.querySelector(hash);

            if (el) {
              const navbarHeight = 100; // adjust if your navbar height changes
              const y = el.getBoundingClientRect().top + window.scrollY - navbarHeight;

              window.scrollTo({
                top: y,
                behavior: 'smooth'
              });
            }

          } else {
            // Navigating to a page without a fragment: go to top
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          }
        }, 50);

      });
  }
}
