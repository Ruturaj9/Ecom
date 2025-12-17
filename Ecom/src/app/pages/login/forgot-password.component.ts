import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  message = '';
  isError = false;

  constructor(private auth: AuthService) {}

  submit() {
    this.message = '';
    this.isError = false;
    if (!this.email || !/^\S+@\S+\.\S+$/.test(this.email)) {
      this.message = 'Please enter a valid email.';
      this.isError = true;
      return;
    }
    this.loading = true;
    this.auth.forgotPassword(this.email).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res?.message || 'Password reset link sent to your email.';
        this.isError = false;
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || 'Failed to send reset link.';
        this.isError = true;
      }
    });
  }
}
