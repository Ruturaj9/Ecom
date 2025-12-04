import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AdminGuard } from './guards/admin.guard';

// Correct path for layout (inside pages/admin)
import { AdminLayoutComponent } from './pages/admin/admin-layout/admin-layout.component';

export const routes: Routes = [

  // Public home page
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full'
  },

  // PUBLIC ROUTES
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/products/products.component')
        .then(m => m.ProductsComponent)
  },

  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-details/product-details.component')
        .then(m => m.ProductDetailsComponent)
  },

  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart.component')
        .then(m => m.CartComponent)
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component')
        .then(m => m.LoginComponent)
  },

  // --------------------------
  // ADMIN ROUTES
  // --------------------------
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin/dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent)
      },

      {
        path: 'products',
        loadComponent: () =>
          import('./pages/admin/product-list/product-list.component')
            .then(m => m.ProductListComponent)
      },

      {
        path: 'upload',
        loadComponent: () =>
          import('./pages/admin/product-uploader/product-uploader.component')
            .then(m => m.ProductUploaderComponent)
      },

      {
        path: 'sliders',
        loadComponent: () =>
          import('./pages/admin/slider-list/slider-list.component')
            .then(m => m.SliderListComponent)
      },

      {
        path: 'slider-upload',
        loadComponent: () =>
          import('./pages/admin/slider-uploader/slider-uploader.component')
            .then(m => m.SliderUploaderComponent)
      },

      {
        path: 'logs',
        loadComponent: () =>
          import('./pages/admin/audit-logs/audit-logs.component')
            .then(m => m.AuditLogsComponent)
      }
    ]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];
