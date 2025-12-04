// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:4000';

  csrfToken: string | null = null;
  currentUser: any = null; // stores logged in user

  constructor(private http: HttpClient) {}

  // ---------------------------------------------------
  // 1) CSRF Token (required before login)
  // ---------------------------------------------------
  loadCsrfToken() {
    return this.http.get<{ csrfToken: string }>(
      `${this.baseUrl}/auth/csrf-token`,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        this.csrfToken = res.csrfToken;
      })
    );
  }

  // ---------------------------------------------------
  // 2) LOGIN — backend sets cookies
  // ---------------------------------------------------
  login(email: string, password: string) {
    if (!this.csrfToken) {
      throw new Error('CSRF token not loaded. Call loadCsrfToken() first.');
    }

    return this.http.post(
      `${this.baseUrl}/auth/login`,
      { email, password },
      {
        withCredentials: true,
        headers: { 'X-CSRF-Token': this.csrfToken }
      }
    );
  }

  // ---------------------------------------------------
  // 3) LOGOUT — clears cookies server-side
  // ---------------------------------------------------
  logout() {
    this.currentUser = null;
    return this.http.post(
      `${this.baseUrl}/auth/logout`,
      {},
      { withCredentials: true }
    );
  }

  // ---------------------------------------------------
  // 4) GET CURRENT USER (uses accessToken cookie)
  // ---------------------------------------------------
  getMe() {
    return this.http.get<{ user: any }>(
      `${this.baseUrl}/auth/me`,
      { withCredentials: true }
    )
    .pipe(
      tap(res => {
        this.currentUser = res.user;
      }),
      catchError(() => {
        this.currentUser = null;
        return of(null);
      })
    );
  }

  // ---------------------------------------------------
  // 5) Return true if logged user is admin
  // ---------------------------------------------------
  isAdmin(): boolean {
    return !!(
      this.currentUser &&
      Array.isArray(this.currentUser.roles) &&
      this.currentUser.roles.includes('admin')
    );
  }

  // ---------------------------------------------------
  // 6) Used by route guards — ensures /auth/me is loaded
  // ---------------------------------------------------
  ensureMe(): Promise<boolean> {
    return new Promise(resolve => {
      if (this.currentUser) return resolve(this.isAdmin());

      this.getMe().subscribe({
        next: () => resolve(this.isAdmin()),
        error: () => resolve(false)
      });
    });
  }
}
