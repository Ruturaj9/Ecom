import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },

  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.component')
      .then(m => m.ProductsComponent)
  },

  {
    path: 'products/:id',
    loadComponent: () => import('./pages/product-details/product-details.component')
      .then(m => m.ProductDetailsComponent)
  },
  {
  path: 'cart',
  loadComponent: () =>
    import('./pages/cart/cart.component').then(m => m.CartComponent)
},
{
  path: 'products/:id',
  loadComponent: () =>
    import('./pages/product-details/product-details.component')
      .then(m => m.ProductDetailsComponent)
}


];
