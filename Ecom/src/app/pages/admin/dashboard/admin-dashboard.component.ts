import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface AuditLog {
  _id: string;
  action: string;
  resourceType: string;
  actorEmail: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],   // ✅ FIXED
  imports: [CommonModule, RouterLink],
})
export class AdminDashboardComponent implements OnInit {

  stats = signal({
    products: 0,
    sliders: 0,
    users: 0,
  });

  logs = signal<AuditLog[]>([]);
  loading = signal(true);
  error = signal('');

  search = signal('');
  actionFilter = signal('');
  userFilter = signal('');

  uniqueActions = computed(() => {
    const set = new Set(this.logs().map(l => l.action || '').filter(Boolean));
    return Array.from(set).sort();
  });

  uniqueUsers = computed(() => {
    const set = new Set(this.logs().map(l => l.actorEmail || '').filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  filteredLogs = computed(() => {
    const s = this.search().trim().toLowerCase();
    const action = this.actionFilter();
    const user = this.userFilter();

    return this.logs().filter(log => {
      const matchesSearch =
        !s ||
        log.action?.toLowerCase().includes(s) ||
        log.resourceType?.toLowerCase().includes(s) ||
        log.actorEmail?.toLowerCase().includes(s);

      const matchesAction =
        !action ||
        log.action?.toLowerCase().includes(action.toLowerCase());

      const matchesUser =
        !user || log.actorEmail === user;

      return matchesSearch && matchesAction && matchesUser;
    });
  });

  private baseAdmin = 'http://localhost:4000/admin';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadStats();
    this.loadLogs();
  }

  loadStats() {
    this.http.get<any>(`${this.baseAdmin}/stats`, { withCredentials: true })
      .subscribe({
        next: res => {
          this.stats.set({
            products: Number(res?.products || 0),
            sliders: Number(res?.sliders || 0),
            users: Number(res?.users || 0),
          });
        },
        error: () => {}
      });
  }

  loadLogs() {
    this.loading.set(true);
    this.error.set('');

    this.http.get<{ logs: AuditLog[] }>(`${this.baseAdmin}/logs?limit=15`, { withCredentials: true })
      .subscribe({
        next: res => {
          this.logs.set(res.logs || []);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load logs.');
          this.loading.set(false);
        }
      });
  }

  prettyAction(action: string) {
    if (!action) return action;
    return action.replace(/\./g, ' · ');
  }
}
