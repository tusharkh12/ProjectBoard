import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { TaskService } from './services/task.service';

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
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'ProjectBoard - Dashboard',
    canActivate: [clearFiltersGuard]
  },
  {
    path: 'tasks',
    loadComponent: () => import('./pages/task-list/task-list.component').then(m => m.TaskListComponent),
    title: 'ProjectBoard - Tasks',
    canActivate: [clearFiltersGuard]
  },
  {
    path: 'tasks/new',
    loadComponent: () => import('./pages/task-form/task-form.component').then(m => m.TaskFormComponent),
    title: 'ProjectBoard - New Task'
  },
  {
    path: 'tasks/:id/edit',
    loadComponent: () => import('./pages/task-form/task-form.component').then(m => m.TaskFormComponent),
    title: 'ProjectBoard - Edit Task'
  },
  {
    path: 'board',
    loadComponent: () => import('./pages/sprint-board/sprint-board.component').then(m => m.SprintBoardComponent),
    title: 'ProjectBoard - Kanban Board',
    canActivate: [clearFiltersGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
] as const; 