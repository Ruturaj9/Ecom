import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  imports: [CommonModule, RouterLink],
})
export class AdminDashboardComponent implements OnInit {

  stats = {
    products: 0,
    sliders: 0,
    users: 0,
  };

  logs: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentLogs();
  }

  loadStats() {
    this.http.get<any>('http://localhost:4000/admin/stats', {
      withCredentials: true
    }).subscribe(res => {
      this.stats = res;
    });
  }

  loadRecentLogs() {
    this.http.get<any>('http://localhost:4000/admin/logs?limit=5', {
      withCredentials: true
    }).subscribe(res => {
      this.logs = res.logs || [];
    });
  }
}
