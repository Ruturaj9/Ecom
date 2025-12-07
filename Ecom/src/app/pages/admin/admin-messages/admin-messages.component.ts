// src/app/pages/admin/admin-messages/admin-messages.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-messages.component.html',
})
export class AdminMessagesComponent implements OnInit {

  loading = signal(false);
  messages = signal<ContactMessage[]>([]);
  error = signal('');
  viewMessage: ContactMessage | null = null;

  private baseAdmin = 'http://localhost:4000/admin';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadMessages();
  }

  /** Fetch all messages */
  loadMessages() {
    this.loading.set(true);
    this.error.set('');

    this.http.get<{ messages: ContactMessage[] }>(
      `${this.baseAdmin}/contact-messages`,
      { withCredentials: true }
    )
    .subscribe({
      next: res => {
        this.messages.set(res.messages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load messages');
        this.loading.set(false);
      }
    });
  }

  /** Delete a single message */
  deleteMessage(id: string) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    this.http.delete(
      `${this.baseAdmin}/contact-messages/${id}`,
      { withCredentials: true }
    )
    .subscribe({
      next: () => {
        this.messages.update(list => list.filter(m => m._id !== id));
      },
      error: () => {
        alert('Failed to delete message');
      }
    });
  }

  /** Open modal with message info */
  openView(msg: ContactMessage) {
    this.viewMessage = msg;
  }

  /** Close modal */
  closeView() {
    this.viewMessage = null;
  }
}
