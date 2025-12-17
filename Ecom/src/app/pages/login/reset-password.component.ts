import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  token = '';
  password = '';
  confirm = '';
  message = '';
  isError = false;
  loading = false;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Support both: /reset-password?token=XYZ and /reset-password/XYZ
    this.route.queryParams.subscribe((q: any) => {
      if (q['token']) this.token = q['token'];
    });

    this.route.params.subscribe((p: any) => {
      if (p['token']) this.token = p['token'];
    });
  }

  submit() {
    this.message = '';
    this.isError = false;

    if (!this.password || this.password.length < 8) {
      this.message = 'Password must be at least 8 characters.';
      this.isError = true;
      return;
    }

    if (this.password !== this.confirm) {
      this.message = 'Passwords do not match.';
      this.isError = true;
      return;
    }

    if (!this.token) {
      this.message = 'Reset token missing.';
      this.isError = true;
      return;
    }

    this.loading = true;

    this.auth.resetPassword(this.token, this.password).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res?.message || 'Password reset successfully! Redirecting...';
        this.isError = false;

        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: any) => {
        this.loading = false;
        this.message = err?.error?.message || 'Reset failed. Try again.';
        this.isError = true;
      }
    });
  }
}
