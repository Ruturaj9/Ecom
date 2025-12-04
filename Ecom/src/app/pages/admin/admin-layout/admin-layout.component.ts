// src/app/pages/admin/admin-layout/admin-layout.component.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {

  constructor(public auth: AuthService) {}

  logout() {
    this.auth.logout().subscribe(() => {
      window.location.href = '/login';
    });
  }
}
