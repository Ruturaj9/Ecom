import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:4000';
  csrfToken: string | null = null;

  constructor(private http: HttpClient) {}

  // 1) Load CSRF token (backend sets cookie and returns token in JSON)
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

  // 2) Login (backend sets httpOnly cookie on success)
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

  // 3) Logout
  logout() {
    return this.http.post(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true });
  }
}
