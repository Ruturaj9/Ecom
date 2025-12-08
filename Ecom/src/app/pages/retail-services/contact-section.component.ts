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
  apiURL = 'http://localhost:4000/contact';   // 🔥 easy to change later

  constructor(private fb: FormBuilder, private http: HttpClient) {

    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]
      ],
      message: ['', Validators.required],
    });
  }

  submitContact() {
    if (this.submitting) return;   // 🔥 prevents double submission

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.responseMsg = 'Please fill all required fields correctly.';
      this.scrollToMessage();
      return;
    }

    this.submitting = true;
    this.responseMsg = '';

    this.http.post(this.apiURL, this.form.value)
      .subscribe({
        next: () => {
          this.responseMsg = 'Your message has been sent successfully!';
          this.form.reset();
          this.submitting = false;
          this.scrollToMessage();
        },
        error: () => {
          this.responseMsg = 'Unable to send your message. Please try again.';
          this.submitting = false;
          this.scrollToMessage();
        }
      });
  }

  /** Smooth scroll to message area for better UX */
  private scrollToMessage() {
    setTimeout(() => {
      const el = document.querySelector('#contact-response');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
}
