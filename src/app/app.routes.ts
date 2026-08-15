import { Routes } from '@angular/router';
import { PortfolioShellComponent } from './features/portfolio/portfolio-shell.component';
import { LoginComponent } from './features/auth/login.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: PortfolioShellComponent },
  { path: 'login', component: LoginComponent },
  { 
    path: 'admin', 
    component: AdminDashboardComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];
