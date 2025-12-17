// src/app/pages/login/register.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription, timer } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  loading = false;

  // Display messages
  errorMessage = '';
  successMessage = '';

  // Password strength
  strengthPercent = 0;
  strengthLabel = 'Weak';
  strengthColor = '#ef4444';

  // OTP system
  otpStep = false;
  otpToken = '';
  otpCode = '';
  otpError = '';
  resendSeconds = 0;
  private resendTimerSub?: Subscription;

  // Toggles
  showPassword = false;
  showConfirm = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],

        email: [
          '',
          [
            Validators.required,
            Validators.email,
            Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/),
            Validators.pattern(/^(?!.*\.\.)/), // No double dots
            Validators.pattern(/^[^@]+@[^@]+\.[^@]+$/), // Valid domain
          ],
        ],

        mobile: [
          '',
          [
            Validators.pattern(/^[1-9][0-9]{9,14}$/), // Strict 10–15 digits, no leading zero
          ],
        ],

        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/[A-Z]/),
            Validators.pattern(/[a-z]/),
            Validators.pattern(/[0-9]/),
            Validators.pattern(/[^A-Za-z0-9]/),
          ],
        ],

        confirmPassword: ['', Validators.required],
      },
      {
        validators: (group) =>
          group.get('password')?.value === group.get('confirmPassword')?.value
            ? null
            : { mismatch: true },
      }
    );
  }

  ngOnDestroy(): void {
    this.resendTimerSub?.unsubscribe();
  }

  get f() {
    return this.form.controls;
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  toggleShowConfirm() {
    this.showConfirm = !this.showConfirm;
  }

  checkStrength() {
    const pwd = this.form.value.password || '';
    let score = 0;

    if (pwd.match(/[a-z]/)) score++;
    if (pwd.match(/[A-Z]/)) score++;
    if (pwd.match(/[0-9]/)) score++;
    if (pwd.match(/[^A-Za-z0-9]/)) score++;
    if (pwd.length >= 12) score++;

    this.strengthPercent = (score / 5) * 100;

    if (score <= 2) {
      this.strengthLabel = 'Weak';
      this.strengthColor = '#ef4444';
    } else if (score === 3) {
      this.strengthLabel = 'Medium';
      this.strengthColor = '#f59e0b';
    } else {
      this.strengthLabel = 'Strong';
      this.strengthColor = '#16a34a';
    }
  }

  register() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please fix all errors before continuing.';
      return;
    }

    const payload = {
      name: this.form.value.name.trim(),
      email: this.form.value.email.trim(),
      password: this.form.value.password,
      mobile: this.form.value.mobile?.trim() || undefined,
    };

    this.loading = true;

    this.auth.register(payload).subscribe({
      next: (res: any) => {
        this.loading = false;

        if (res?.needsOtp && res?.otpToken) {
          this.otpStep = true;
          this.otpToken = res.otpToken;
          this.successMessage = 'OTP has been sent to your mobile number.';
          this.startResendTimer(60);
          return;
        }

        if (res?.emailVerificationSent) {
          this.successMessage =
            'Account created! Please check your email to verify.';
          return;
        }

        this.successMessage =
          res?.message || 'Account created successfully! Redirecting...';

        setTimeout(() => this.router.navigate(['/login']), 1200);
      },

      error: (err: any) => {
        this.loading = false;
        this.handleRegisterError(err);
      },
    });
  }

  handleRegisterError(err: any) {
    if (err.status === 409) {
      this.errorMessage = err.error?.message || 'Email already in use.';
      return;
    }

    if (err.status === 400) {
      const body = err.error;

      if (body?.errors) {
        this.errorMessage = body.errors.map((e: any) => e.message).join(' ');
        return;
      }

      if (body?.message) {
        this.errorMessage = body.message;
        return;
      }
    }

    this.errorMessage = err.error?.message || 'Registration failed.';
  }

  verifyOtp() {
    if (!this.otpCode || !this.otpToken) {
      this.otpError = 'Please enter the OTP correctly.';
      return;
    }

    this.loading = true;

    this.auth.verifyOtp(this.otpToken, this.otpCode).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.successMessage = res?.message || 'Phone verified successfully!';
        this.otpStep = false;

        setTimeout(() => this.router.navigate(['/login']), 900);
      },

      error: (err: any) => {
        this.loading = false;
        this.otpError = err.error?.message || 'Incorrect OTP. Try again.';
      },
    });
  }

  resendOtp() {
    if (!this.otpToken) return;

    this.auth.resendOtp(this.otpToken).subscribe({
      next: () => {
        this.successMessage = 'OTP resent successfully!';
        this.startResendTimer(45);
      },
      error: (err: any) => {
        this.otpError = err.error?.message || 'Unable to resend OTP.';
      },
    });
  }

  startResendTimer(seconds: number) {
    this.resendTimerSub?.unsubscribe();
    this.resendSeconds = seconds;

    this.resendTimerSub = timer(0, 1000).subscribe((n) => {
      const remaining = seconds - n;
      this.resendSeconds = remaining > 0 ? remaining : 0;

      if (remaining <= 0) this.resendTimerSub?.unsubscribe();
    });
  }

  resendEmailVerification() {
    const email = this.form.value.email;

    if (!email) {
      this.errorMessage = 'Please enter your email to resend verification.';
      return;
    }

    this.auth.resendEmailVerification(email).subscribe({
      next: () => {
        this.successMessage = 'Verification email has been resent.';
      },
      error: (err: any) => {
        this.errorMessage =
          err.error?.message || 'Failed to resend verification email.';
      },
    });
  }
}
