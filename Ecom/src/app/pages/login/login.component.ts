import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {

  email = '';
  password = '';

  message = '';
  isError = false;
  loading = false;

  emailError = '';
  passwordError = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Pre-load CSRF automatically
    this.auth.loadCsrfToken().subscribe();
  }

  validate(): boolean {
    this.emailError = '';
    this.passwordError = '';

    // Email validation — Google-grade
    if (!this.email.trim()) {
      this.emailError = 'Email is required.';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(this.email)) {
      this.emailError = 'Enter a valid email address.';
    } else if (this.email.includes('..')) {
      this.emailError = 'Email cannot contain consecutive dots.';
    }

    // Password rules
    if (!this.password.trim()) {
      this.passwordError = 'Password is required.';
    } else if (this.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters.';
    }

    return !(this.emailError || this.passwordError);
  }

  login() {
    this.message = '';
    this.isError = false;

    if (!this.validate()) return;

    this.loading = true;

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Logged in successfully!';
        this.isError = false;

        this.router.navigate(['/admin/upload']);
      },
      error: (err) => {
        this.loading = false;

        if (err.status === 401) {
          this.message = 'Incorrect email or password.';
        } else {
          this.message = err.error?.message || 'Login failed.';
        }
        this.isError = true;
      }
    });
  }

  forgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
