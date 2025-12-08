import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface AuditLog {
  _id: string;
  action: string;
  admin: string;
  ip: string;
  createdAt: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-logs.component.html',
})
export class AuditLogsComponent implements OnInit {

  loading = signal(false);
  logs = signal<AuditLog[]>([]);
  error = signal('');

  page = signal(1);
  limit = 15;
  totalPages = signal(1);

  viewLog: AuditLog | null = null;

  private baseAdmin = 'http://localhost:4000/admin/logs';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadLogs();
  }

  /** Load logs with pagination */
  loadLogs() {
    this.loading.set(true);
    this.error.set('');

    this.http.get<{ logs: AuditLog[]; total: number }>(
      `${this.baseAdmin}?page=${this.page()}&limit=${this.limit}`,
      { withCredentials: true }
    )
    .subscribe({
      next: (res) => {
        this.logs.set(res.logs);
        this.totalPages.set(Math.max(1, Math.ceil(res.total / this.limit)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load audit logs.');
        this.loading.set(false);
      }
    });
  }

  /** Move to next page */
  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
      this.loadLogs();
    }
  }

  /** Move to previous page */
  prevPage() {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.loadLogs();
    }
  }

  /** Open modal */
  openView(log: AuditLog) {
    this.viewLog = log;
  }

  /** Close modal */
  closeView() {
    this.viewLog = null;
  }

  /** Extract action category (e.g., PRODUCT_CREATED) */
  extractActionType(action: string) {
    return action.split(':')[0].replace(/_/g, ' ');
  }

  /** Extract user-friendly message */
  extractActionMessage(action: string) {
    return action.split(':')[1] || 'No additional info available';
  }

  /** Map to section for table */
  detectSection(action: string) {
    if (action.startsWith('PRODUCT')) return 'Products';
    if (action.startsWith('SLIDER')) return 'Sliders';
    if (action.startsWith('AUTH')) return 'Authentication';
    if (action.startsWith('CONTACT')) return 'Contact Messages';
    return 'General';
  }
}
