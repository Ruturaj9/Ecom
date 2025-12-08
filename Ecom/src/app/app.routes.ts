// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AdminGuard } from './guards/admin.guard';
import { AdminLayoutComponent } from './pages/admin/admin-layout/admin-layout.component';

/**
 * Optimized, production-ready routing configuration.
 *
 * ✅ Core logic preserved exactly
 * ✅ Theme untouched
 * ✅ Lazy loading optimized
 * ✅ Performance improved (standalone + OnPush-friendly)
 * ✅ Admin area isolated for faster initial load
 * ✅ Guard behavior preserved
 * ✅ Cleaner and more scalable structure
 */

export const routes: Routes = [
  // -------------------------
  // PUBLIC HOME ROUTE
  // -------------------------
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
  },

  // -------------------------
  // PUBLIC ROUTES (Lazy Loaded)
  // -------------------------
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/products/products.component').then(
        (m) => m.ProductsComponent
      ),
  },

  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-details/product-details.component').then(
        (m) => m.ProductDetailsComponent
      ),
  },

  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart.component').then((m) => m.CartComponent),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about.component').then((m) => m.AboutComponent),
  },

  {
    path: 'retail-services',
    loadComponent: () =>
      import('./pages/retail-services/retail-services.component').then(
        (m) => m.RetailServicesComponent
      ),
  },

  // -------------------------
  // ADMIN SECTION (Lazy Loaded Children)
  // -------------------------
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
        runGuardsAndResolvers: 'always',
      },

      {
        path: 'products',
        loadComponent: () =>
          import('./pages/admin/product-list/product-list.component').then(
            (m) => m.ProductListComponent
          ),
        runGuardsAndResolvers: 'always',
      },

      {
        path: 'upload',
        loadComponent: () =>
          import('./pages/admin/product-uploader/product-uploader.component').then(
            (m) => m.ProductUploaderComponent
          ),
        runGuardsAndResolvers: 'always',
      },

      {
        path: 'sliders',
        loadComponent: () =>
          import('./pages/admin/slider-list/slider-list.component').then(
            (m) => m.SliderListComponent
          ),
        runGuardsAndResolvers: 'always',
      },

      {
        path: 'slider-upload',
        loadComponent: () =>
          import('./pages/admin/slider-uploader/slider-uploader.component').then(
            (m) => m.SliderUploaderComponent
          ),
        runGuardsAndResolvers: 'always',
      },

      {
        path: 'logs',
        loadComponent: () =>
          import('./pages/admin/audit-logs/audit-logs.component').then(
            (m) => m.AuditLogsComponent
          ),
        runGuardsAndResolvers: 'always',
      },

      {
        path: 'messages',
        loadComponent: () =>
          import('./pages/admin/admin-messages/admin-messages.component').then(
            (m) => m.AdminMessagesComponent
          ),
        runGuardsAndResolvers: 'always',
      },
    ],
  },

  // -------------------------
  // WILDCARD — MUST REMAIN LAST
  // -------------------------
  {
    path: '**',
    redirectTo: '',
  },
];
