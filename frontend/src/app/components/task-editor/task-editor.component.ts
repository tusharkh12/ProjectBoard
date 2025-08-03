import { Component, inject, signal, input, output, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority, TaskUtils, CreateTaskRequest, UpdateTaskRequest, ConflictErrorResponse, IssueUtils } from '../../models/task.model';

export interface TaskEditorData {
  mode: 'create' | 'edit';
  task?: Task;
  preselectedStatus?: TaskStatus;
}

export interface ConflictResolution {
  action: 'reload' | 'overwrite' | 'cancel';
  conflictData?: ConflictErrorResponse;
}

/**
 * Unified Task Editor Component - Jira/YouTrack Style
 * 
 * Features:
 * - Single component for both create and edit modes
 * - Professional Jira/YouTrack styling with CSS variables
 * - Optimistic locking conflict resolution
 * - Improved assignee field with suggestions
 * - Accessible design with ARIA support
 * - Modern Angular 20 patterns with signals
 */
@Component({
  selector: 'app-task-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    MatAutocompleteModule
  ],
  templateUrl: './task-editor.component.html',
  styleUrls: ['./task-editor.component.scss']
})
export class TaskEditorComponent {
  readonly taskService = inject(TaskService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<TaskEditorComponent>);
  private readonly data = inject<TaskEditorData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  // Expose utilities for template
  readonly IssueUtils = IssueUtils;

  // Inputs from dialog data
  readonly mode = signal<'create' | 'edit'>(this.data.mode);
  readonly task = signal<Task | null>(this.data.task || null);

  // Component state
  readonly saving = signal(false);
  readonly showConflictDialog = signal(false);
  readonly conflictData = signal<ConflictErrorResponse | null>(null);

  // Computed properties
  readonly isEditMode = computed(() => this.mode() === 'edit');
  readonly tagPreview = computed(() => {
    const tags = this.taskForm.get('tags')?.value;
    return TaskUtils.parseTags(tags);
  });

  // Assignee suggestions from existing tasks
  readonly allAssignees = computed(() => {
    const assignees = this.taskService.tasks()
        .map(task => task.assignee)
        .filter(assignee => assignee && assignee.trim())
        // de-duplicate
        .filter((assignee, index, array) => array.indexOf(assignee) === index);
    return assignees as string[];
  });

  // Assignee search signal to track input changes
  private readonly _assigneeSearch = signal('');

  readonly filteredAssignees = computed(() => {
    const searchTerm = this._assigneeSearch().toLowerCase().trim();
    const allAssignees = this.allAssignees();
    
    // If search term is empty, show all
    if (!searchTerm) {
      return allAssignees;
    }
    
    // If search term exactly matches an existing assignee, show all options
    if (allAssignees.some(user => user.toLowerCase() === searchTerm)) {
      return allAssignees;
    }
    
    // Filter and sort: prioritize names that start with search term
    const startsWith = allAssignees.filter(user => 
      user.toLowerCase().startsWith(searchTerm)
    );
    
    const contains = allAssignees.filter(user => 
      !user.toLowerCase().startsWith(searchTerm) && 
      user.toLowerCase().includes(searchTerm)
    );
    
    // Return names starting with search term first, then names containing it
    return [...startsWith, ...contains];
  });

  // Tags chip input properties
  readonly selectedTags = signal<string[]>([]);
  readonly allTags = computed(() => {
    const allTaskTags = this.taskService.tasks()
        .map(task => task.tags)
        .filter(tags => tags && tags.trim())
        .flatMap(tags => TaskUtils.parseTags(tags))
        // de-duplicate
        .filter((tag, index, array) => array.indexOf(tag) === index)
        .sort(); // Sort alphabetically for better UX
    
    // Include some common default tags if no tags exist yet
    const defaultTags = ['frontend', 'backend', 'api', 'ui', 'bug', 'feature', 'refactor'];
    const uniqueTags = [...new Set([...allTaskTags, ...defaultTags])].sort();
    
    return uniqueTags;
  });
  
  readonly filteredTags = computed(() => {
    const inputValue = this.taskForm.get('tagInput')?.value?.toLowerCase() || '';
    if (!inputValue) return this.allTags();
    return this.allTags().filter(tag => 
      tag.toLowerCase().includes(inputValue) && !this.selectedTags().includes(tag)
    );
  });

  // Form definition
  readonly taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(1000)]],
    status: [TaskStatus.BACKLOG, [Validators.required]],
    priority: [TaskPriority.MEDIUM, [Validators.required]],
    assignee: ['', [Validators.maxLength(100)]],
    estimatedHours: [null, [Validators.min(0), Validators.max(1000)]],
    tags: ['', [Validators.maxLength(500)]],
    tagInput: [''] // For chip input autocomplete
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
    // Subscribe to form changes to update reactive signal
    this.taskForm.valueChanges.subscribe(() => {
      this.updateFormValueSignal();
    });

    // Initialize form value signal
    this.updateFormValueSignal();

    // Initialize form based on mode
    effect(() => {
      if (this.isEditMode() && this.task()) {
        this.populateFormFromTask(this.task()!);
      } else if (this.data.preselectedStatus) {
        this.taskForm.patchValue({ status: this.data.preselectedStatus });
      }
    });
  }

  private populateFormFromTask(task: Task): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignee: task.assignee || '',
      estimatedHours: task.estimatedHours || null,
      tags: task.tags || ''
    });
    
    // Populate selected tags from task
    if (task.tags) {
      const tags = TaskUtils.parseTags(task.tags);
      this.selectedTags.set([...tags]); // Create mutable copy
    }

    // Update form value signal after populating
    this.updateFormValueSignal();
  }

  save(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    // For edit mode, only allow save if there are actual changes
    if (this.isEditMode() && !this.hasFormChanges()) {
      this.snackBar.open('No changes to save', 'Close', { duration: 2000 });
      return;
    }

    this.saving.set(true);
    const formValue = this.taskForm.value;

    if (this.isEditMode()) {
      this.updateTask(formValue);
    } else {
      this.createTask(formValue);
    }
  }

  private createTask(formValue: any): void {
    const newTask: CreateTaskRequest = {
      title: formValue.title,
      summary: formValue.title,
      description: formValue.description || '',
      status: formValue.status,
      priority: formValue.priority,
      assignee: formValue.assignee || undefined,
      estimatedHours: formValue.estimatedHours || undefined,
      tags: formValue.tags || undefined
    };

    this.taskService.createTask(newTask).subscribe({
      next: (createdTask) => {
        this.saving.set(false);
        this.snackBar.open('Task created successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(createdTask);
      },
      error: (error) => {
        this.saving.set(false);
        this.snackBar.open('Failed to create task: ' + (error.message || 'Unknown error'), 'Close', { duration: 5000 });
      }
    });
  }

  private updateTask(formValue: any): void {
    const currentTask = this.task()!;
    const updatedTask: UpdateTaskRequest = {
      id: currentTask.id!,
      summary: formValue.title,
      title: formValue.title,
      description: formValue.description || '',
      status: formValue.status,
      priority: formValue.priority,
      assignee: formValue.assignee || undefined,
      estimatedHours: formValue.estimatedHours || undefined,
      tags: formValue.tags || undefined,
      version: currentTask.version || 0
    };

    this.taskService.updateTask(updatedTask).subscribe({
      next: (updatedTask) => {
        this.saving.set(false);
        this.snackBar.open('Task updated successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(updatedTask);
      },
      error: (error) => {
        this.saving.set(false);
        
        // Handle optimistic locking conflicts  
        if (error.error === 'OPTIMISTIC_LOCK_CONFLICT') {
          this.handleOptimisticLockConflict(error);
        } else {
          this.snackBar.open('Failed to update task: ' + (error.message || 'Unknown error'), 'Close', { duration: 5000 });
        }
      }
    });
  }

  private handleOptimisticLockConflict(conflictError: ConflictErrorResponse): void {
    console.log('Conflict detected:', conflictError);
    this.conflictData.set(conflictError);
    this.showConflictDialog.set(true);
  }

  resolveConflict(action: 'discard' | 'override' | 'merge' | 'cancel'): void {
    this.showConflictDialog.set(false);
    
    switch (action) {
      case 'discard':
        // Close dialog and signal to refresh with latest version
        this.snackBar.open('Changes discarded, loading latest version', 'Close', { duration: 3000 });
        this.dialogRef.close('refresh');
        return;
        
      case 'override':
        // Force save user changes with current server version
        this.saving.set(true);
        const formValue = this.taskForm.value;
        const currentTask = this.task()!;
        
        const forcedUpdate: UpdateTaskRequest = {
          id: currentTask.id!,
          summary: formValue.title || currentTask.title,
          title: formValue.title || currentTask.title,
          description: formValue.description || currentTask.description || '',
          status: formValue.status || currentTask.status,
          priority: formValue.priority || currentTask.priority,
          assignee: formValue.assignee || undefined,
          estimatedHours: formValue.estimatedHours || undefined,
          tags: formValue.tags || undefined,
          version: this.conflictData()!.currentData.version! // Use the latest version to force overwrite
        };

        this.taskService.updateTask(forcedUpdate).subscribe({
          next: (updatedTask) => {
            this.saving.set(false);
            this.snackBar.open('Your changes saved successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(updatedTask);
          },
          error: (error) => {
            this.saving.set(false);
            this.snackBar.open('Failed to save changes: ' + (error.message || 'Unknown error'), 'Close', { duration: 5000 });
          }
        });
        break;
        
      case 'merge':
        // Open merge dialog with both versions
        this.openMergeDialog();
        return; // Don't clear conflict data yet
        
      case 'cancel':
        // Do nothing, user can continue editing
        break;
    }
    
    this.conflictData.set(null);
  }

  // Merge functionality
  readonly showMergeDialog = signal(false);
  readonly mergeSelections = signal<{[field: string]: 'user' | 'server'}>({});

  private openMergeDialog(): void {
    this.showConflictDialog.set(false);
    this.initializeMergeSelections();
    this.showMergeDialog.set(true);
  }

  private initializeMergeSelections(): void {
    if (!this.conflictData()?.currentData) return;
    
    const selections: {[field: string]: 'user' | 'server'} = {};
    const fields = ['title', 'description', 'status', 'priority', 'assignee', 'estimatedHours', 'tags'];
    
    fields.forEach(field => {
      if (this.hasFieldConflict(field)) {
        selections[field] = 'user'; // Default to user's version
      }
    });
    
    this.mergeSelections.set(selections);
  }

  selectMergeOption(field: string, choice: 'user' | 'server'): void {
    this.mergeSelections.update(current => ({
      ...current,
      [field]: choice
    }));
  }

  applyMerge(): void {
    if (!this.conflictData()?.currentData) return;
    
    this.saving.set(true);
    const formValue = this.taskForm.value;
    const serverData = this.conflictData()!.currentData;
    const selections = this.mergeSelections();
    const currentTask = this.task()!;
    
    // Build merged update based on user selections
    const mergedUpdate: UpdateTaskRequest = {
      id: currentTask.id!,
      summary: selections['title'] === 'user' ? (formValue.title || currentTask.title) : serverData.title,
      title: selections['title'] === 'user' ? (formValue.title || currentTask.title) : serverData.title,
      description: selections['description'] === 'user' ? (formValue.description || '') : (serverData.description || ''),
      status: selections['status'] === 'user' ? (formValue.status || currentTask.status) : serverData.status,
      priority: selections['priority'] === 'user' ? (formValue.priority || currentTask.priority) : serverData.priority,
      assignee: selections['assignee'] === 'user' ? formValue.assignee : serverData.assignee,
      estimatedHours: selections['estimatedHours'] === 'user' ? formValue.estimatedHours : serverData.estimatedHours,
      tags: selections['tags'] === 'user' ? formValue.tags : serverData.tags,
      version: this.conflictData()!.currentData.version!
    };

    this.taskService.updateTask(mergedUpdate).subscribe({
      next: (updatedTask) => {
        this.saving.set(false);
        this.showMergeDialog.set(false);
        this.snackBar.open('Changes merged and saved successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(updatedTask);
      },
      error: (error) => {
        this.saving.set(false);
        this.snackBar.open('Failed to save merged changes: ' + (error.message || 'Unknown error'), 'Close', { duration: 5000 });
      }
    });
  }

  cancelMerge(): void {
    this.showMergeDialog.set(false);
    this.showConflictDialog.set(true);
  }

  getCurrentFormValue(field: string): any {
    return this.taskForm.get(field)?.value || '';
  }

  hasFieldConflict(field: string): boolean {
    if (!this.conflictData()?.currentData) return false;
    
    const currentValue = this.getCurrentFormValue(field);
    const serverTask = this.conflictData()!.currentData;
    const serverValue = (serverTask as any)[field];
    
    // Handle null/undefined values
    const normalizeValue = (val: any) => val === null || val === undefined ? '' : String(val);
    
    return normalizeValue(currentValue) !== normalizeValue(serverValue);
  }

  getStatusDisplay(status: TaskStatus): string {
    return TaskUtils.getStatusDisplay(status).displayName;
  }

  getConflictingFields(): string[] {
    if (!this.conflictData()?.currentData) return [];
    
    const fields = ['title', 'description', 'status', 'priority', 'assignee', 'estimatedHours', 'tags'];
    return fields.filter(field => this.hasFieldConflict(field));
  }

  getFieldDisplayName(field: string): string {
    const displayNames: { [key: string]: string } = {
      title: 'Title',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      assignee: 'Assignee',
      estimatedHours: 'Estimated Hours',
      tags: 'Tags'
    };
    return displayNames[field] || field;
  }

  getFieldDisplayValue(field: string, source: 'user' | 'server'): string {
    const value = source === 'user' 
      ? this.getCurrentFormValue(field)
      : (this.conflictData()!.currentData as any)[field];

    if (value === null || value === undefined || value === '') {
      return 'No value';
    }

    // Handle special field types
    switch (field) {
      case 'status':
        return this.getStatusDisplay(value as TaskStatus);
      case 'priority':
        return this.getPriorityDisplay(value as TaskPriority);
      case 'estimatedHours':
        return value ? `${value} hours` : 'No estimate';
      default:
        return String(value);
    }
  }

  getValidationMessage(): string {
    if (this.taskForm.valid) return '';
    
    const errors = [];
    if (this.taskForm.get('title')?.invalid) errors.push('Title is required');
    if (this.taskForm.get('status')?.invalid) errors.push('Status is required');
    if (this.taskForm.get('priority')?.invalid) errors.push('Priority is required');
    
    return errors.join(', ');
  }

  displayAssignee(user: string): string {
    return user || '';
  }

  getPriorityDisplay(priority: TaskPriority): string {
    return TaskUtils.getPriorityDisplay(priority).displayName;
  }

  getPriorityIcon(priority: TaskPriority): string {
    return TaskUtils.getPriorityDisplay(priority).icon;
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

  // Tag chip management methods
  addTag(tag: string): void {
    if (tag && !this.selectedTags().includes(tag)) {
      this.selectedTags.update(tags => [...tags, tag]);
      this.updateTagsForm();
      this.taskForm.get('tagInput')?.setValue('');
    }
  }

  removeTag(tagToRemove: string): void {
    this.selectedTags.update(tags => tags.filter(tag => tag !== tagToRemove));
    this.updateTagsForm();
  }

  // Add multiple tags from comma-separated input
  addMultipleTags(input: string): void {
    // Split by comma, semicolon, or space and clean up each tag
    const tags = input.split(/[,;]/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .filter(tag => !this.selectedTags().includes(tag)); // Remove duplicates
    
    if (tags.length > 0) {
      this.selectedTags.update(existingTags => [...existingTags, ...tags]);
      this.updateTagsForm();
      this.taskForm.get('tagInput')?.setValue('');
    }
  }

  onTagInputKeydown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    
    if (event.key === 'Enter' && value) {
      event.preventDefault();
      this.addMultipleTags(value);
    } else if ((event.key === ',' || event.key === ';') && value) {
      event.preventDefault();
      this.addMultipleTags(value);
    }
  }

  // Handle tag input changes (for paste and real-time comma detection)
  onTagInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // If input contains comma or semicolon, automatically process tags
    if (value.includes(',') || value.includes(';')) {
      this.addMultipleTags(value);
    }
  }

  // Handle tag input blur - add tag when user clicks away
  onTagInputBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    
    if (value) {
      this.addMultipleTags(value);
    }
  }

  onTagSelected(tag: string): void {
    this.addTag(tag);
  }

  private updateTagsForm(): void {
    const tagsString = this.selectedTags().join(',');
    this.taskForm.get('tags')?.setValue(tagsString, { emitEvent: false });
    // Manually update signal since we disabled emitEvent
    this.updateFormValueSignal();
  }

  // Handle assignee input changes for autocomplete
  onAssigneeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this._assigneeSearch.set(input.value || '');
  }

  // Form value signal to track reactive changes
  private readonly _formValue = signal<any>({});

  // Track form changes
  readonly hasFormChanges = computed(() => {
    if (!this.isEditMode()) {
      // For create mode, form is "changed" if any required fields are filled
      const formValue = this._formValue();
      return !!(formValue.title?.trim() || formValue.description?.trim());
    }

    // For edit mode, compare current form values with original task
    const currentTask = this.task();
    const formValue = this._formValue();
    const currentTags = this.selectedTags().join(',');
    
    if (!currentTask) return false;

    return (
      formValue.title !== currentTask.title ||
      (formValue.description || '') !== (currentTask.description || '') ||
      formValue.status !== currentTask.status ||
      formValue.priority !== currentTask.priority ||
      (formValue.assignee || '') !== (currentTask.assignee || '') ||
      (formValue.estimatedHours || 0) !== (currentTask.estimatedHours || 0) ||
      currentTags !== (currentTask.tags || '')
    );
  });

  // Update form value signal when form changes
  private updateFormValueSignal(): void {
    this._formValue.set({...this.taskForm.value});
  }
}