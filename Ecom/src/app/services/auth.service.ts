// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:4000';

  csrfToken: string | null = null;

  // Stores logged-in user reactively
  private userSubject = new BehaviorSubject<any | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ---------------------------------------------------
  // CSRF TOKEN
  // ---------------------------------------------------
  loadCsrfToken() {
    return this.http
      .get<{ csrfToken: string }>(`${this.baseUrl}/auth/csrf-token`, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          this.csrfToken = res.csrfToken;
        })
      );
  }

  // ---------------------------------------------------
  // LOGIN
  // ---------------------------------------------------
  login(email: string, password: string) {
    if (!this.csrfToken) {
      throw new Error('CSRF token not loaded.');
    }

    return this.http
      .post(
        `${this.baseUrl}/auth/login`,
        { email, password },
        {
          withCredentials: true,
          headers: { 'X-CSRF-Token': this.csrfToken },
        }
      )
      .pipe(
        tap(() => {
          // After login, fetch logged user
          this.getMe().subscribe();
        })
      );
  }

  // ---------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------
  logout() {
    this.userSubject.next(null);

    return this.http.post(
      `${this.baseUrl}/auth/logout`,
      {},
      { withCredentials: true }
    );
  }

  // ---------------------------------------------------
  // FETCH CURRENT USER
  // ---------------------------------------------------
  getMe() {
    return this.http
      .get<{ user: any }>(`${this.baseUrl}/auth/me`, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          this.userSubject.next(res.user);
        }),
        catchError(() => {
          this.userSubject.next(null);
          return of(null);
        })
      );
  }

  // ---------------------------------------------------
  // PURE ADMIN CHECK
  // ---------------------------------------------------
  private checkAdmin(user: any): boolean {
    return !!(user && Array.isArray(user.roles) && user.roles.includes('admin'));
  }

  // ---------------------------------------------------
  // ⭐ FIXED — USED BY GUARD
  // ensureMe() MUST return Observable<boolean>
  // ---------------------------------------------------
  ensureMe() {
    const existingUser = this.userSubject.value;

    // Case 1: Already loaded → return Observable<boolean>
    if (existingUser) {
      return of(this.checkAdmin(existingUser));
    }

    // Case 2: Need to fetch user → return Observable<boolean>
    return this.getMe().pipe(
      map(() => this.checkAdmin(this.userSubject.value))
    );
  }

  // ------------------------------------------------------------------
  // Added methods (only these are appended; existing logic unchanged)
  // ------------------------------------------------------------------

  // ---------------------------------------------------
  // REGISTER USER
  // ---------------------------------------------------
  register(data: { name: string; email: string; password: string; mobile?: string }) {
    return this.http.post(
      `${this.baseUrl}/auth/register`,
      data,
      {
        withCredentials: true,
        headers: this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}
      }
    );
  }

  // ---------------------------------------------------
  // VERIFY MOBILE OTP  (Optional if your backend supports it)
  // ---------------------------------------------------
  verifyOtp(otpToken: string, code: string) {
    return this.http.post(
      `${this.baseUrl}/auth/verify-otp`,
      { otpToken, code },
      {
        withCredentials: true,
        headers: this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}
      }
    );
  }

  // ---------------------------------------------------
  // RESEND MOBILE OTP (Optional)
  // ---------------------------------------------------
  resendOtp(otpToken: string) {
    return this.http.post(
      `${this.baseUrl}/auth/resend-otp`,
      { otpToken },
      {
        withCredentials: true,
        headers: this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}
      }
    );
  }

  // ---------------------------------------------------
  // RESEND EMAIL VERIFICATION
  // ---------------------------------------------------
  resendEmailVerification(email: string) {
    return this.http.post(
      `${this.baseUrl}/auth/resend-email-verification`,
      { email },
      {
        withCredentials: true,
        headers: this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}
      }
    );
  }

  // ---------------------------------------------------
  // FORGOT PASSWORD (request email link)
  // ---------------------------------------------------
  forgotPassword(email: string) {
    return this.http.post(
      `${this.baseUrl}/auth/forgot-password`,
      { email },
      {
        withCredentials: true,
        headers: this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}
      }
    );
  }

  // ---------------------------------------------------
  // RESET PASSWORD (with emailed token)
  // ---------------------------------------------------
  resetPassword(token: string, password: string) {
    return this.http.post(
      `${this.baseUrl}/auth/reset-password`,
      { token, password },
      {
        withCredentials: true,
        headers: this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}
      }
    );
  }
}
