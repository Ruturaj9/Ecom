// src/app/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean | UrlTree> {
    // Ensure /auth/me is loaded OR use cached user
    const isAdmin = await this.auth.ensureMe();

    if (isAdmin) {
      return true;
    }

    // Not admin → redirect to login
    return this.router.parseUrl('/login');
  }
}
