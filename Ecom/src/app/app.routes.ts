import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [

  // Home Page
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full'
  },

  // Products List Page
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/products/products.component')
        .then(m => m.ProductsComponent)
  },

  // Product Details Page
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-details/product-details.component')
        .then(m => m.ProductDetailsComponent)
  },

  // Cart Page
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart.component')
        .then(m => m.CartComponent)
  },

  // Admin Product Upload
  {
    path: 'admin/upload',
    loadComponent: () =>
      import('./pages/admin/product-uploader/product-uploader.component')
        .then(m => m.ProductUploaderComponent)
  },

  // Login
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component')
        .then(m => m.LoginComponent)
  },

  // Admin Slider Upload
  {
    path: 'admin/slider-upload',
    loadComponent: () =>
      import('./pages/admin/slider-uploader/slider-uploader.component')
        .then(m => m.SliderUploaderComponent)
  },

  // 404 Fallback
  {
    path: '**',
    redirectTo: ''
  }
];
