import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contact-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-section.component.html',
})
export class ContactSectionComponent {

  form: FormGroup;
  submitting = false;
  responseMsg = '';

  constructor(private fb: FormBuilder, private http: HttpClient) {

    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],

      // ⭐ Full mobile validation: 10 digits, starts with 6–9
      phone: [
        '',
        [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]
      ],

      message: ['', Validators.required],
    });
  }

  submitContact() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.responseMsg = 'Please fill all required fields correctly.';
      return;
    }

    this.submitting = true;
    this.responseMsg = '';

    this.http.post('http://localhost:4000/contact', this.form.value)
      .subscribe({
        next: () => {
          this.responseMsg = 'Your message has been sent successfully!';
          this.form.reset();
          this.submitting = false;
        },
        error: () => {
          this.responseMsg = 'Unable to send your message. Please try again.';
          this.submitting = false;
        }
      });
  }
}
