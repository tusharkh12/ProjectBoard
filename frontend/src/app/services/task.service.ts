import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskSearchCriteria, 
  TaskStatistics,
  ConflictErrorResponse,
  TaskStatus,
  TaskPriority,
  IssueUtils
} from '../models/task.model';

/**
 * Angular 20 Task Service with Modern Signals
 * 
 * Features:
 * - Signal-based reactive state
 * - HTTP client integration with Spring Boot backend
 * - Optimistic locking conflict handling
 * - Strong typing throughout
 * - Modern inject() pattern
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  
  private readonly http = inject(HttpClient);
  private readonly API_BASE = 'http://localhost:8080/api/tasks';
  
  // Signals for reactive state management
  private readonly _tasks = signal<readonly Task[]>([]);
  private readonly _selectedTask = signal<Task | null>(null);
  private readonly _searchCriteria = signal<TaskSearchCriteria>({});
  private readonly _error = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _statistics = signal<TaskStatistics | null>(null);
  
  // Public readonly signals
  readonly tasks = this._tasks.asReadonly();
  readonly selectedTask = this._selectedTask.asReadonly();
  readonly error = this._error.asReadonly();
  readonly searchCriteria = this._searchCriteria.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly statistics = this._statistics.asReadonly();
  
  // Computed signals for derived state
  readonly filteredTasks = computed(() => {
    const allTasks = this._tasks();
    const criteria = this._searchCriteria();
    
    if (!this.hasActiveFilters(criteria)) {
      return allTasks;
    }
    
    const filtered = allTasks.filter((task: Task) => {
      // Legacy single value filters (AND logic)
      if (criteria.status && task.status !== criteria.status) return false;
      if (criteria.priority && task.priority !== criteria.priority) return false;
      if (criteria.assignee && !task.assignee?.toLowerCase().includes(criteria.assignee.toLowerCase())) return false;
      
      // Multi-select filters (OR logic within each category, AND between categories)
      if (criteria.selectedStatuses && criteria.selectedStatuses.length > 0) {
        if (!criteria.selectedStatuses.includes(task.status)) return false;
      }
      
      if (criteria.selectedPriorities && criteria.selectedPriorities.length > 0) {
        if (!criteria.selectedPriorities.includes(task.priority)) return false;
      }
      
      if (criteria.selectedAssignees && criteria.selectedAssignees.length > 0) {
        const taskAssignee = task.assignee?.toLowerCase() || '';
        const hasMatchingAssignee = criteria.selectedAssignees.some(assignee => 
          taskAssignee.includes(assignee.toLowerCase())
        );
        if (!hasMatchingAssignee) return false;
      }
      
      // Search term filter (should work independently of other filters)
      if (criteria.searchTerm) {
        const searchLower = criteria.searchTerm.toLowerCase();
        const matchesSearch = (
          (task.title?.toLowerCase?.() || '').includes(searchLower) ||
          (task.summary?.toLowerCase?.() || '').includes(searchLower) ||
          (task.description?.toLowerCase?.() || '').includes(searchLower) ||
          (task.issueId?.toLowerCase?.() || '').includes(searchLower) ||
          (task.tags?.toLowerCase?.() || '').includes(searchLower) ||
          (task.assignee?.toLowerCase?.() || '').includes(searchLower)
        );
        if (!matchesSearch) return false;
      }
      
      return true;
    });
    
    return filtered;
  });
  
  readonly taskCount = computed(() => this.filteredTasks().length);
  
  readonly tasksByStatus = computed(() => {
    const tasks = this.filteredTasks();
    return {
      backlog: tasks.filter((t: Task) => t.status === TaskStatus.BACKLOG).length,
      inProgress: tasks.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS).length,
      review: tasks.filter((t: Task) => t.status === TaskStatus.REVIEW).length,
      testing: tasks.filter((t: Task) => t.status === TaskStatus.TESTING).length,
      done: tasks.filter((t: Task) => t.status === TaskStatus.DONE).length
    };
  });
  
  readonly tasksByPriority = computed(() => {
    const tasks = this.filteredTasks();
    return {
      low: tasks.filter((t: Task) => t.priority === TaskPriority.LOW).length,
      medium: tasks.filter((t: Task) => t.priority === TaskPriority.MEDIUM).length,
      high: tasks.filter((t: Task) => t.priority === TaskPriority.HIGH).length,
      critical: tasks.filter((t: Task) => t.priority === TaskPriority.CRITICAL).length
    };
  });
  
  constructor() {
    // Load initial data
    this.loadTasks().subscribe({
      next: () => console.log('Tasks loaded successfully'),
      error: (error) => {
        console.error('Error loading tasks in constructor:', error);
        this._loading.set(false);
      }
    });
    this.loadStatistics().subscribe({
      error: (error) => console.warn('Error loading statistics in constructor:', error)
    });
  }
  
  // CRUD Operations
  
  /**
   * Load all tasks
   */
  loadTasks(): Observable<readonly Task[]> {
    this._loading.set(true);
    this._error.set(null);
    
    // Always load all tasks and filter client-side for better search support
    const request$ = this.http.get<Task[]>(this.API_BASE).pipe(
      map(tasks => tasks.map(task => ({
        ...task,
        issueId: IssueUtils.generateIssueId(task.id || 0)
      })) as readonly Task[])
    );
    
    return request$.pipe(
      tap(tasks => {
        this._tasks.set(tasks);
        this._loading.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Get task by ID
   */
  getTask(id: number): Observable<Task> {
    this._loading.set(true);
    this._error.set(null);
    
    return this.http.get<Task>(`${this.API_BASE}/${id}`).pipe(
      map(task => ({
        ...task,
        issueId: IssueUtils.generateIssueId(task.id || 0)
      })),
      tap(task => {
        this._selectedTask.set(task);
        this._loading.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Set selected task
   */
  setSelectedTask(task: Task | null): void {
    this._selectedTask.set(task);
  }

  /**
   * Force clear loading state (for debugging/error recovery)
   */
  clearLoadingState(): void {
    this._loading.set(false);
  }
  
  /**
   * Create new task
   */
  createTask(request: CreateTaskRequest): Observable<Task> {
    this._loading.set(true);
    this._error.set(null);
    
    return this.http.post<Task>(this.API_BASE, request).pipe(
      map(newTask => ({
        ...newTask,
        issueId: IssueUtils.generateIssueId(newTask.id || 0)
      })),
      tap(newTask => {
        this._tasks.update(tasks => [...tasks, newTask]);
        this._loading.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Update existing task with optimistic locking
   */
  updateTask(request: UpdateTaskRequest): Observable<Task> {
    this._loading.set(true);
    this._error.set(null);
    
    return this.http.put<Task>(`${this.API_BASE}/${request.id}`, request).pipe(
      map(updatedTask => ({
        ...updatedTask,
        issueId: IssueUtils.generateIssueId(updatedTask.id || 0)
      })),
      tap(updatedTask => {
        this._tasks.update(tasks => 
          tasks.map(task => task.id === updatedTask.id ? updatedTask : task)
        );
        if (this._selectedTask()?.id === updatedTask.id) {
          this._selectedTask.set(updatedTask);
        }
        this._loading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this._loading.set(false);
        if (this.isConflictError(error)) {
          return throwError(() => error.error as ConflictErrorResponse);
        }
        return this.handleError(error);
      })
    );
  }
  
  /**
   * Delete task
   */
  deleteTask(id: number): Observable<void> {
    this._loading.set(true);
    this._error.set(null);
    
    return this.http.delete<void>(`${this.API_BASE}/${id}`).pipe(
      tap(() => {
        this._tasks.update(tasks => tasks.filter(task => task.id !== id));
        if (this._selectedTask()?.id === id) {
          this._selectedTask.set(null);
        }
        this._loading.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  /**
   * Update search criteria and reload tasks
   */
  updateSearchCriteria(criteria: TaskSearchCriteria): void {
    console.log('TaskService - Received search criteria:', criteria); // Debug log
    this._searchCriteria.set(criteria);
    this.loadTasks().subscribe();
  }
  
  /**
   * Clear all filters and reload tasks
   */
  clearFilters(): void {
    this._searchCriteria.set({});
    this.loadTasks().subscribe();
  }
  
  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }
  
  /**
   * Load statistics
   */
  loadStatistics(): Observable<TaskStatistics> {
    return this.http.get<TaskStatistics>(`${this.API_BASE}/statistics`).pipe(
      tap(stats => this._statistics.set(stats)),
      catchError(error => {
        console.warn('Failed to load statistics:', error);
        return throwError(() => error);
      })
    );
  }
  
  // Private helper methods
  
  private searchTasksWithCriteria(criteria: TaskSearchCriteria): Observable<readonly Task[]> {
    let params = new HttpParams();
    if (criteria.status) params = params.set('status', criteria.status);
    if (criteria.priority) params = params.set('priority', criteria.priority);
    if (criteria.assignee) params = params.set('assignee', criteria.assignee);
    if (criteria.searchTerm) params = params.set('searchTerm', criteria.searchTerm);
    
    return this.http.get<Task[]>(`${this.API_BASE}/search`, { params }).pipe(
      map(tasks => tasks.map(task => ({
        ...task,
        issueId: IssueUtils.generateIssueId(task.id || 0)
      })) as readonly Task[])
    );
  }
  
  private hasActiveFilters(criteria: TaskSearchCriteria): boolean {
    return !!(
      criteria.status || 
      criteria.priority || 
      criteria.assignee || 
      criteria.searchTerm ||
      (criteria.selectedStatuses && criteria.selectedStatuses.length > 0) ||
      (criteria.selectedPriorities && criteria.selectedPriorities.length > 0) ||
      (criteria.selectedAssignees && criteria.selectedAssignees.length > 0) ||
      (criteria.selectedTypes && criteria.selectedTypes.length > 0)
    );
  }
  
  private isConflictError(error: HttpErrorResponse): boolean {
    return error.status === 409 && error.error?.error === 'OPTIMISTIC_LOCK_CONFLICT';
  }
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      switch (error.status) {
        case 404:
          errorMessage = 'Task not found';
          break;
        case 400:
          errorMessage = error.error?.message || 'Invalid request';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }
    
    this._error.set(errorMessage);
    this._loading.set(false);
    
    return throwError(() => new Error(errorMessage));
  }
} 