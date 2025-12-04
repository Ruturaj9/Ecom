// src/app/pages/admin/admin-layout/admin-layout.component.ts
import { Component, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  templateUrl: './admin-layout.component.html',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
})
export class AdminLayoutComponent implements OnDestroy {
  private routerSub: Subscription | null = null;

  constructor(
    public auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    // Listen to navigation end events and run a small CD pass inside NgZone.
    // This forces the layout to reflect the newly-activated child immediately.
    this.routerSub = this.router.events
      .pipe(filter(evt => evt instanceof NavigationEnd))
      .subscribe(() => {
        // ensure inside zone (should normally be) and run CD
        this.ngZone.run(() => {
          try { window.scrollTo(0, 0); } catch {}
          // immediate sync detect
          try { this.cdr.detectChanges(); } catch {}
        });
      });
  }

  // Called when router-outlet activates a new component instance.
  // We run a detectChanges here to ensure the UI updates immediately on first activation.
  onActivate(_: unknown) {
    this.ngZone.run(() => {
      try { this.cdr.detectChanges(); } catch {}
    });
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login')
    });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
      this.routerSub = null;
    }
  }
}
