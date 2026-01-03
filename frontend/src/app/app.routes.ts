import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { TaskService } from './services/task.service';
import { authGuard } from './guards/auth.guard';

// Route guard to reset all active filters before activating any route
export const clearFiltersGuard = () => {
  const taskService = inject(TaskService);
  taskService.clearFilters();
  return true;
};

/**
 * Angular 20 Application Routes
 * 
 * Features:
 * - Lazy loading for all routes
 * - Component input binding for route parameters
 * - Proper titles for each route
 * - Feature-based organization
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'ProjectBoard - Login'
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
    title: 'ProjectBoard - Register'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'ProjectBoard - Dashboard',
    canActivate: [authGuard, clearFiltersGuard]
  },
  {
    path: 'tasks',
    loadComponent: () => import('./pages/task-list/task-list.component').then(m => m.TaskListComponent),
    title: 'ProjectBoard - Tasks',
    canActivate: [authGuard, clearFiltersGuard]
  },
  {
    path: 'tasks/new',
    loadComponent: () => import('./pages/task-form/task-form.component').then(m => m.TaskFormComponent),
    title: 'ProjectBoard - New Task',
    canActivate: [authGuard]
  },
  {
    path: 'tasks/:id/edit',
    loadComponent: () => import('./pages/task-form/task-form.component').then(m => m.TaskFormComponent),
    title: 'ProjectBoard - Edit Task',
    canActivate: [authGuard]
  },
  {
    path: 'board',
    loadComponent: () => import('./pages/sprint-board/sprint-board.component').then(m => m.SprintBoardComponent),
    title: 'ProjectBoard - Kanban Board',
    canActivate: [authGuard, clearFiltersGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
] as const; 