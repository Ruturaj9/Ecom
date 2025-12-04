import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],   // <-- IMPORTANT
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.message = '';
    this.loading = true;

    // Step A: load CSRF
    this.auth.loadCsrfToken().subscribe({
      next: () => {
        // Step B: login
        this.auth.login(this.email, this.password).subscribe({
          next: () => {
            this.loading = false;
            this.message = 'Logged in successfully!';
            this.router.navigate(['/admin/upload']);
          },
          error: (err) => {
            this.loading = false;
            console.error(err);
            this.message = err.error?.error || 'Login failed';
          }
        });
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.message = 'Failed to load CSRF token';
      }
    });
  }
}
