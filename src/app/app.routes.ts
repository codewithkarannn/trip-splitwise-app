import { Routes } from '@angular/router';
import {Dashboard} from '../components/dashboard/dashboard';
import {authGuard} from '../guards/auth-guard';
import {TripDashboard} from '../components/trip-dashboard/trip-dashboard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/dashboard/dashboard')
    .then(m => m.Dashboard),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('../components/dashboard/dashboard')
      .then(m => m.Dashboard),

    canActivate: [authGuard]
  },
  {
    path: 'trip',
    loadComponent: () => import('../components/trip-dashboard/trip-dashboard')
      .then(m => m.TripDashboard),
    canActivate: [authGuard]
  },


  {
    path: 'login',
    loadComponent: () => import('../components/login-component/login-component')
      .then(m => m.LoginComponent)
  }
];
