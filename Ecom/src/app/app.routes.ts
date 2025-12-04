// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [

  // Public Routes
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full'
  },

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

  // Admin Section
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadComponent: () =>
      import('./pages/admin/admin-layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin/admin-home/admin-home.component')
            .then(m => m.AdminHomeComponent)
      },

      {
        path: 'upload',
        loadComponent: () =>
          import('./pages/admin/product-uploader/product-uploader.component')
            .then(m => m.ProductUploaderComponent)
      },

      {
        path: 'slider-upload',
        loadComponent: () =>
          import('./pages/admin/slider-uploader/slider-uploader.component')
            .then(m => m.SliderUploaderComponent)
      },

      // Missing pages will be added later
    ]
  },

  // 404 fallback
  {
    path: '**',
    redirectTo: ''
  }
];
