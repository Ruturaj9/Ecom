import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate() {
    return this.auth.ensureMe().pipe(
      map(isAdmin => {
        if (isAdmin) return true;
        return this.router.parseUrl('/login');
      })
    );
  }
}
