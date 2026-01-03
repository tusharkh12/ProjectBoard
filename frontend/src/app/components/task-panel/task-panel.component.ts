import { Component, inject, input, output, signal, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority, TaskUtils, IssueUtils, UpdateTaskRequest, ConflictErrorResponse } from '../../models/task.model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';

export interface TaskPanelData {
  taskId: number;
}

/**
 * Jira-Style Task Panel Component
 * 
 * Features:
 * - Large right panel that slides in from the right
 * - Inline editing for all fields
 * - Maximize button for full-page editing
 * - Professional Jira-like styling
 * - Responsive design
 */
@Component({
  selector: 'app-task-panel',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  templateUrl: './task-panel.component.html',
  styleUrls: ['./task-panel.component.scss']
})
export class TaskPanelComponent {
  readonly taskService = inject(TaskService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  // Input properties
  readonly taskId = input.required<number>();
  readonly isOpen = input.required<boolean>();

  // Output events
  readonly closePanel = output<void>();

  // Expose utilities for template
  readonly IssueUtils = IssueUtils;

  // Component state
  readonly task = signal<Task | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isEditing = signal(false);
  readonly saving = signal(false);

  // Edit form
  readonly editForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    status: ['', Validators.required],
    priority: ['', Validators.required],
    assignee: [''],
    estimatedHours: [null],
    tags: ['']
  });

  readonly priorityOptions = [
    { value: TaskPriority.LOW, label: TaskUtils.getPriorityDisplay(TaskPriority.LOW).displayName },
    { value: TaskPriority.MEDIUM, label: TaskUtils.getPriorityDisplay(TaskPriority.MEDIUM).displayName },
    { value: TaskPriority.HIGH, label: TaskUtils.getPriorityDisplay(TaskPriority.HIGH).displayName },
    { value: TaskPriority.CRITICAL, label: TaskUtils.getPriorityDisplay(TaskPriority.CRITICAL).displayName }
  ] as const;

  readonly statusOptions = [
    { value: TaskStatus.BACKLOG, label: TaskUtils.getStatusDisplay(TaskStatus.BACKLOG).displayName },
    { value: TaskStatus.IN_PROGRESS, label: TaskUtils.getStatusDisplay(TaskStatus.IN_PROGRESS).displayName },
    { value: TaskStatus.REVIEW, label: TaskUtils.getStatusDisplay(TaskStatus.REVIEW).displayName },
    { value: TaskStatus.TESTING, label: TaskUtils.getStatusDisplay(TaskStatus.TESTING).displayName },
    { value: TaskStatus.DONE, label: TaskUtils.getStatusDisplay(TaskStatus.DONE).displayName }
  ] as const;

  constructor() {
    // Load task data when taskId changes
    effect(() => {
      const id = this.taskId();
      if (id) {
        this.loadTaskData();
      }
    });
  }

  loadTaskData(): void {
    const id = this.taskId();
    if (!id) {
      this.error.set('No task ID provided');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.taskService.getTask(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (task) => {
          this.task.set(task);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set('Failed to load task: ' + (error.message || 'Unknown error'));
          this.loading.set(false);
          console.error('Error loading task:', error);
        }
      });
  }

  toggleEditMode(): void {
    if (this.isEditing()) {
      // Cancel editing
      this.isEditing.set(false);
      this.editForm.reset();
    } else {
      // Start editing
      const currentTask = this.task();
      if (currentTask) {
        this.editForm.patchValue({
          title: currentTask.title,
          description: currentTask.description || '',
          status: currentTask.status,
          priority: currentTask.priority,
          assignee: currentTask.assignee || '',
          estimatedHours: currentTask.estimatedHours || null,
          tags: currentTask.tags || ''
        });
        this.isEditing.set(true);
      }
    }
  }

  saveChanges(): void {
    if (!this.editForm.valid || !this.task()?.id) return;

    this.saving.set(true);
    const formValue = this.editForm.value;

    const currentTask = this.task()!;
    const updatedTask: UpdateTaskRequest = {
      id: currentTask.id!,
      summary: formValue.title,
      title: formValue.title,
      description: formValue.description,
      status: formValue.status,
      priority: formValue.priority,
      assignee: formValue.assignee || undefined,
      estimatedHours: formValue.estimatedHours || undefined,
      tags: formValue.tags || undefined,
      version: currentTask.version || 0
    };

    this.taskService.updateTask(updatedTask)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedTask) => {
          this.task.set(updatedTask);
          this.isEditing.set(false);
          this.saving.set(false);
          this.snackBar.open('Task updated successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.saving.set(false);
          
          // Handle optimistic locking conflicts
          if (error.error === 'OPTIMISTIC_LOCK_CONFLICT') {
            this.handleOptimisticLockConflict(error as ConflictErrorResponse);
          } else {
            this.snackBar.open('Failed to update task: ' + (error.message || 'Unknown error'), 'Close', { duration: 5000 });
          }
        }
      });
  }

  private handleOptimisticLockConflict(conflictError: ConflictErrorResponse): void {
    const currentVersion = this.task()?.version ?? 0;
    const serverVersion = conflictError.currentData.version ?? 0;
    
    const message = `This task was modified by another user while you were editing.\n\n` +
      `Current server version: ${serverVersion}\n` +
      `Your version: ${currentVersion}\n\n` +
      `Would you like to:\n` +
      `• Reload the latest version (you will lose your changes)\n` +
      `• Force save your changes (overwrite the other changes)`;

    const dialogData: ConfirmDialogData = {
      title: 'Conflict Detected',
      message: message,
      confirmText: 'Reload Latest',
      cancelText: 'Force Save',
      confirmColor: 'primary'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((reload: boolean) => {
        if (reload) {
      // Reload the latest version
      this.task.set(conflictError.currentData);
      this.isEditing.set(false);
      this.snackBar.open('Loaded latest version. Your changes were discarded.', 'Close', { duration: 4000 });
    } else {
      // Force save with current version
      const formValue = this.editForm.value;
      const currentTask = this.task()!;
      
      const forcedUpdate: UpdateTaskRequest = {
        id: currentTask.id!,
        summary: formValue.title,
        title: formValue.title,
        description: formValue.description,
        status: formValue.status,
        priority: formValue.priority,
        assignee: formValue.assignee || undefined,
        estimatedHours: formValue.estimatedHours || undefined,
        tags: formValue.tags || undefined,
        version: conflictError.currentData.version! // Use the latest version to force overwrite
      };

      this.taskService.updateTask(forcedUpdate)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (updatedTask) => {
            this.task.set(updatedTask);
            this.isEditing.set(false);
            this.saving.set(false);
            this.snackBar.open('Task saved with force overwrite', 'Close', { duration: 3000 });
          },
          error: (error) => {
            this.saving.set(false);
            this.snackBar.open('Failed to force save: ' + (error.message || 'Unknown error'), 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  duplicateTask(): void {
    const currentTask = this.task();
    if (currentTask) {
      this.snackBar.open(`Duplicate functionality would create a copy of "${currentTask.title}"`, 'Close', { duration: 3000 });
    }
  }

  deleteTask(): void {
    const currentTask = this.task();
    if (!currentTask?.id) return;

    const taskId = currentTask.id; // Store ID to avoid type issues

    const dialogData: ConfirmDialogData = {
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${currentTask.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'warn'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed && taskId) {
          this.taskService.deleteTask(taskId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.snackBar.open('Task deleted successfully', 'Close', { duration: 3000 });
                this.closePanel.emit();
              },
              error: (error) => {
                this.snackBar.open('Failed to delete task: ' + (error.message || 'Unknown error'), 'Close', { duration: 5000 });
              }
            });
        }
      });
  }



  closeTaskPanel(): void {
    // Emit close event to parent component
    this.closePanel.emit();
  }

  getTaskTags(): readonly string[] {
    const currentTask = this.task();
    return currentTask ? TaskUtils.parseTags(currentTask.tags) : [];
  }

  getPriorityDisplay(priority: TaskPriority): string {
    return TaskUtils.getPriorityDisplay(priority).displayName;
  }

  getPriorityIcon(priority: TaskPriority): string {
    return TaskUtils.getPriorityDisplay(priority).icon;
  }

  getStatusDisplay(status: TaskStatus): string {
    return TaskUtils.getStatusDisplay(status).displayName;
  }

  getStatusIcon(status: TaskStatus): string {
    return TaskUtils.getStatusDisplay(status).icon;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActivityCount(): number {
    // Placeholder for activity count - would be fetched from API in production
    const currentTask = this.task();
    if (!currentTask) return 0;
    
    // Simple heuristic: count based on task updates
    let count = 1; // At least one activity (creation)
    if (currentTask.updatedAt && currentTask.createdAt && 
        currentTask.updatedAt !== currentTask.createdAt) {
      count++;
    }
    return count;
  }
} 