import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';
  isError = false;
  loading = false;

  emailError = '';
  passwordError = '';

  constructor(private auth: AuthService, private router: Router) {}

  validate() {
    this.emailError = '';
    this.passwordError = '';

    if (!this.email.trim()) this.emailError = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(this.email)) this.emailError = 'Invalid email format.';

    if (!this.password.trim()) this.passwordError = 'Password is required.';
    else if (this.password.length < 6) this.passwordError = 'Password must be at least 6 characters.';

    return !(this.emailError || this.passwordError);
  }

  login() {
    this.message = '';
    this.isError = false;

    if (!this.validate()) return;

    this.loading = true;

    // Step A: Load CSRF
    this.auth.loadCsrfToken().subscribe({
      next: () => {
        // Step B: Login
        this.auth.login(this.email, this.password).subscribe({
          next: () => {
            this.loading = false;
            this.message = 'Logged in successfully!';
            this.isError = false;
            this.router.navigate(['/admin/upload']);
          },
          error: (err) => {
            this.loading = false;
            this.message = err.error?.error || 'Login failed';
            this.isError = true;
          }
        });
      },
      error: () => {
        this.loading = false;
        this.message = 'Failed to load CSRF token';
        this.isError = true;
      }
    });
  }

  forgotPassword() {
    alert('Password reset feature is not implemented yet.');
  }
}
