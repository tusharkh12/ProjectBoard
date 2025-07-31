import { Component, inject, signal, computed, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';

import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority, TaskUtils, CreateTaskRequest, UpdateTaskRequest } from '../../models/task.model';

/**
 * Angular 20 Task Form Component
 * 
 * Features:
 * - Signal-based reactive state management
 * - Reactive forms with comprehensive validation
 * - Create and Edit modes with route parameter binding
 * - Material Design with professional styling
 * - Optimistic locking conflict handling
 * - Step-by-step form wizard
 */
@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatStepperModule
  ],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent {
  readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  // Route parameter for task ID (Angular 20 with signals) - Fixed syntax
  readonly id = input<string>();

  // Component state
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly currentTask = signal<Task | null>(null);

  // Computed signals
  readonly isEditMode = computed(() => {
    const taskId = this.id();
    return !!(taskId && taskId !== 'new');
  });
  readonly tagPreview = computed(() => {
    const tags = this.taskForm.get('tags')?.value;
    return TaskUtils.parseTags(tags);
  });

  // Form definition with comprehensive validation
  readonly taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(1000)]],
    status: [TaskStatus.BACKLOG, [Validators.required]],
    priority: [TaskPriority.MEDIUM, [Validators.required]],
    assignee: ['', [Validators.maxLength(100)]],
    estimatedHours: [null, [Validators.min(0), Validators.max(1000)]],
    tags: ['', [Validators.maxLength(500)]]
  });

  // Options for dropdowns
  readonly statusOptions = signal([
    { value: TaskStatus.BACKLOG, label: TaskUtils.getStatusDisplay(TaskStatus.BACKLOG).displayName },
    { value: TaskStatus.IN_PROGRESS, label: TaskUtils.getStatusDisplay(TaskStatus.IN_PROGRESS).displayName },
    { value: TaskStatus.REVIEW, label: TaskUtils.getStatusDisplay(TaskStatus.REVIEW).displayName },
    { value: TaskStatus.TESTING, label: TaskUtils.getStatusDisplay(TaskStatus.TESTING).displayName },
    { value: TaskStatus.DONE, label: TaskUtils.getStatusDisplay(TaskStatus.DONE).displayName }
  ]);

  readonly priorityOptions = signal([
    { value: TaskPriority.LOW, label: TaskUtils.getPriorityDisplay(TaskPriority.LOW).displayName },
    { value: TaskPriority.MEDIUM, label: TaskUtils.getPriorityDisplay(TaskPriority.MEDIUM).displayName },
    { value: TaskPriority.HIGH, label: TaskUtils.getPriorityDisplay(TaskPriority.HIGH).displayName },
    { value: TaskPriority.CRITICAL, label: TaskUtils.getPriorityDisplay(TaskPriority.CRITICAL).displayName }
  ]);

  constructor() {
    // Effect to watch for route parameter changes and load task data
    effect(() => {
      const taskId = this.id();
      if (taskId && taskId !== 'new') {
        this.loadTaskData(taskId);
      } else {
        // Reset form for new task - ensure form is properly initialized
        this.currentTask.set(null);
        this.errorMessage.set(null);
        this.isSubmitting.set(false);
        
        // Reset form to default values for new task
        this.taskForm.reset({
          title: '',
          description: '',
          status: TaskStatus.BACKLOG,
          priority: TaskPriority.MEDIUM,
          assignee: '',
          estimatedHours: null,
          tags: ''
        });
        
        // Mark form as pristine and untouched
        this.taskForm.markAsUntouched();
        this.taskForm.markAsPristine();
      }
    });
  }

  private loadTaskData(taskIdStr: string): void {
    const id = parseInt(taskIdStr, 10);
    if (isNaN(id)) {
      this.errorMessage.set('Invalid task ID. Please check the URL and try again.');
      return;
    }

    // Set loading state
    this.isSubmitting.set(false);
    this.errorMessage.set(null);

    this.taskService.getTask(id).subscribe({
      next: (task) => {
        if (task) {
          this.currentTask.set(task);
          this.populateForm(task);
          this.errorMessage.set(null);
        } else {
          this.errorMessage.set('Task not found. It may have been deleted or moved.');
        }
      },
      error: (error) => {
        console.error('Error loading task:', error);
        if (error.status === 404) {
          this.errorMessage.set('Task not found. It may have been deleted or you may not have permission to view it.');
        } else if (error.status === 403) {
          this.errorMessage.set('You do not have permission to edit this task.');
        } else {
          this.errorMessage.set('Failed to load task data: ' + (error.message || 'Unknown error occurred'));
        }
      }
    });
  }

  private populateForm(task: Task): void {
    this.taskForm.patchValue({
      title: task.title || '',
      description: task.description || '',
      status: task.status || TaskStatus.BACKLOG,
      priority: task.priority || TaskPriority.MEDIUM,
      assignee: task.assignee || '',
      estimatedHours: task.estimatedHours || null,
      tags: task.tags || ''
    });
    
    // Mark form as pristine since we just loaded data
    this.taskForm.markAsPristine();
    this.taskForm.markAsUntouched();
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.markAllFieldsAsTouched();
      this.errorMessage.set('Please fix the validation errors before submitting');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    if (this.isEditMode()) {
      this.updateTask();
    } else {
      this.createTask();
    }
  }

  private createTask(): void {
    const formValue = this.taskForm.value;
    const request: CreateTaskRequest = {
      title: formValue.title,
      summary: formValue.title, // Add summary for YouTrack compatibility
      description: formValue.description,
      status: formValue.status,
      priority: formValue.priority,
      assignee: formValue.assignee,
      estimatedHours: formValue.estimatedHours,
      tags: formValue.tags
    };

    this.taskService.createTask(request).subscribe({
      next: (task) => {
        this.isSubmitting.set(false);
        this.snackBar.open('Task created successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/tasks']);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Failed to create task. Please try again.');
        console.error('Error creating task:', error);
      }
    });
  }

  private updateTask(): void {
    const currentTask = this.currentTask();
    if (!currentTask?.id) {
      this.errorMessage.set('Invalid task data');
      this.isSubmitting.set(false);
      return;
    }

    const formValue = this.taskForm.value;
    const request: UpdateTaskRequest = {
      id: currentTask.id!,
      title: formValue.title,
      summary: formValue.title, // Add summary for YouTrack compatibility
      description: formValue.description,
      status: formValue.status,
      priority: formValue.priority,
      assignee: formValue.assignee,
      estimatedHours: formValue.estimatedHours,
      tags: formValue.tags,
      version: currentTask.version || 0
    };

    this.taskService.updateTask(request).subscribe({
      next: (task) => {
        this.isSubmitting.set(false);
        this.snackBar.open('Task updated successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/tasks']);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        if (error.error === 'OPTIMISTIC_LOCK_CONFLICT') {
          this.handleOptimisticLockConflict(error);
        } else {
          this.errorMessage.set('Failed to update task. Please try again.');
          console.error('Error updating task:', error);
        }
      }
    });
  }

  private handleOptimisticLockConflict(error: any): void {
    const message = `This task was modified by another user. Would you like to reload the latest version and lose your changes?`;
    
    const confirmDialog = this.snackBar.open(message, 'RELOAD', { duration: 10000 });
    
    confirmDialog.onAction().subscribe(() => {
      const currentId = this.id();
      if (currentId) {
        this.loadTaskData(currentId);
      }
    });
  }

  confirmDelete(): void {
    const currentTask = this.currentTask();
    if (!currentTask?.id) return;

    const confirmDialog = this.snackBar.open(
      `Delete "${currentTask.title}"? This action cannot be undone.`,
      'DELETE',
      { duration: 10000 }
    );

    confirmDialog.onAction().subscribe(() => {
      this.taskService.deleteTask(currentTask.id!).subscribe({
        next: () => {
          this.snackBar.open('Task deleted successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/tasks']);
        },
        error: () => {
          this.errorMessage.set('Failed to delete task');
        }
      });
    });
  }

  clearError(): void {
    this.errorMessage.set(null);
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.taskForm.controls).forEach(key => {
      this.taskForm.get(key)?.markAsTouched();
    });
  }

  // Form group getters for stepper
  getBasicFormGroup(): FormGroup {
    return this.fb.group({
      title: this.taskForm.get('title'),
      description: this.taskForm.get('description'),
      assignee: this.taskForm.get('assignee'),
      estimatedHours: this.taskForm.get('estimatedHours')
    });
  }

  getClassificationFormGroup(): FormGroup {
    return this.fb.group({
      status: this.taskForm.get('status'),
      priority: this.taskForm.get('priority'),
      tags: this.taskForm.get('tags')
    });
  }

  // Helper methods for display
  getStatusDisplay(status: TaskStatus): string {
    return TaskUtils.getStatusDisplay(status).displayName;
  }

  getPriorityDisplay(priority: TaskPriority): string {
    return TaskUtils.getPriorityDisplay(priority).displayName;
  }

  getStatusIcon(status: TaskStatus): string {
    return TaskUtils.getStatusDisplay(status).icon;
  }

  getPriorityIcon(priority: TaskPriority): string {
    return TaskUtils.getPriorityDisplay(priority).icon;
  }

  getStatusChipClass(status: TaskStatus): string {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }

  getPriorityChipClass(priority: TaskPriority): string {
    return `priority-${priority.toLowerCase()}`;
  }

  getPriorityClass(priority: TaskPriority): string {
    return `priority-${priority.toLowerCase()}`;
  }
} 