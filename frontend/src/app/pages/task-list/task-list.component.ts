import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';

import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority, TaskUtils, IssueUtils, ConflictErrorResponse, TaskSearchCriteria } from '../../models/task.model';

import { TaskPanelComponent } from '../../components/task-panel/task-panel.component';

import { TaskEditorComponent, TaskEditorData } from '../../components/task-editor/task-editor.component';
import {FilterPanelComponent} from "../../components/filter-panel/filter-panel.component";

/**
 * Professional Task List Component
 * 
 * Features:
 * - Professional design and layout
 * - Advanced filtering and search capabilities
 * - Rich task cards with complete metadata
 * - Professional toolbar and controls
 * - Bulk operations and selection
 * - Professional task formatting and display
 */
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
    TaskPanelComponent
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit, OnDestroy {
  // Angular 20 - Use inject() for DI
  readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  // Task Status and Priority enums for template use
  readonly TaskStatus = TaskStatus;
  readonly TaskPriority = TaskPriority;
  readonly IssueUtils = IssueUtils;

  // Reactive form for filters
  readonly filterForm: FormGroup = this.fb.group({
    searchTerm: [''],
    statuses: [[]],
    priorities: [[]],
    assignees: [[]],
    types: [[]]
  });

  // Component state signals
  readonly viewMode = signal<'cards' | 'list' | 'compact'>('cards');
  readonly sortBy = signal<string>('updatedAt');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly searchTerm = signal<string>('');
  
  // Stable timestamp for relative time calculations
  private readonly currentTime = signal<number>(Date.now());
  private timeUpdateInterval?: number;
  
  // Selection state
  readonly selectedIssues = signal<Task[]>([]);

  readonly selectedAssignees = signal<string[]>([]);

  // Filter state
  readonly selectedStatuses = signal<TaskStatus[]>([]);
  readonly selectedPriorities = signal<TaskPriority[]>([]);
  readonly selectedTypes = signal<string[]>([]);

  // Task panel state
  readonly selectedTaskId = signal<number | null>(null);
  readonly isPanelOpen = signal(false);

  // Available filter options
  readonly availableStatuses = signal([
    { value: TaskStatus.BACKLOG, label: TaskUtils.getStatusDisplay(TaskStatus.BACKLOG).displayName },
    { value: TaskStatus.IN_PROGRESS, label: TaskUtils.getStatusDisplay(TaskStatus.IN_PROGRESS).displayName },
    { value: TaskStatus.REVIEW, label: TaskUtils.getStatusDisplay(TaskStatus.REVIEW).displayName },
    { value: TaskStatus.TESTING, label: TaskUtils.getStatusDisplay(TaskStatus.TESTING).displayName },
    { value: TaskStatus.DONE, label: TaskUtils.getStatusDisplay(TaskStatus.DONE).displayName }
  ]);

  readonly availablePriorities = signal([
    { value: TaskPriority.CRITICAL, label: TaskUtils.getPriorityDisplay(TaskPriority.CRITICAL).displayName },
    { value: TaskPriority.HIGH, label: TaskUtils.getPriorityDisplay(TaskPriority.HIGH).displayName },
    { value: TaskPriority.MEDIUM, label: TaskUtils.getPriorityDisplay(TaskPriority.MEDIUM).displayName },
    { value: TaskPriority.LOW, label: TaskUtils.getPriorityDisplay(TaskPriority.LOW).displayName }
  ]);

  readonly sortOptions = signal([
    { value: 'status', label: 'Status', icon: 'assignment_turned_in' },
    { value: 'priority', label: 'Priority', icon: 'flag' },
    { value: 'assignee', label: 'Assignee', icon: 'person' },
    { value: 'createdAt', label: 'Created', icon: 'access_time' },
    { value: 'updatedAt', label: 'Updated', icon: 'schedule' }
  ]);

  // Computed properties
  readonly allTasks = computed(() => this.taskService.filteredTasks());
  readonly allAssignees = computed(() => {
    const assignees = new Set<string>();
    this.allTasks().forEach(task => {
      if (task.assignee) {
        assignees.add(task.assignee);
      }
    });
    return Array.from(assignees).sort();
  });

  readonly sortedAndFilteredTasks = computed(() => {
    let tasks = this.allTasks();

    // Apply search filter - use signal for reactivity
    const searchTerm = this.searchTerm().toLowerCase();
    if (searchTerm) {
      tasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm)) ||
        IssueUtils.generateIssueId(task.id || 0).toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    const selectedStatuses = this.selectedStatuses();
    if (selectedStatuses.length > 0) {
      tasks = tasks.filter(task => selectedStatuses.includes(task.status));
    }

    // Apply priority filter
    const selectedPriorities = this.selectedPriorities();
    if (selectedPriorities.length > 0) {
      tasks = tasks.filter(task => selectedPriorities.includes(task.priority));
    }

    // Apply assignee filter
    const selectedAssignees = this.selectedAssignees();
    if (selectedAssignees.length > 0) {
      tasks = tasks.filter(task => 
        task.assignee && selectedAssignees.includes(task.assignee)
      );
    }

    // Apply sorting - IMPORTANT: Read both signals to ensure reactivity
    const sortBy = this.sortBy();
    const sortDirection = this.sortDirection();
    tasks = tasks.slice().sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'status':
          const statusOrder = { 
            [TaskStatus.BACKLOG]: 0, 
            [TaskStatus.IN_PROGRESS]: 1, 
            [TaskStatus.REVIEW]: 2, 
            [TaskStatus.TESTING]: 3, 
            [TaskStatus.DONE]: 4 
          };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'priority':
          const priorityOrder = { [TaskPriority.CRITICAL]: 0, [TaskPriority.HIGH]: 1, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 3 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'assignee':
          aValue = a.assignee || '';
          bValue = b.assignee || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
        default:
          aValue = new Date(a.updatedAt || a.createdAt || '').getTime();
          bValue = new Date(b.updatedAt || b.createdAt || '').getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return tasks;
  });

  ngOnInit(): void {
    this.refreshIssues();
    
    // Update time signal every minute to refresh relative timestamps
    this.timeUpdateInterval = setInterval(() => {
      this.currentTime.set(Date.now());
    }, 60000) as any; // Update every minute
  }

  ngOnDestroy(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  refreshIssues(): void {
    this.taskService.loadTasks().subscribe();
    this.selectedIssues.set([]);
  }

  // Search functionality
  updateSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.filterForm.patchValue({ searchTerm: target.value });
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.filterForm.patchValue({ searchTerm: '' });
  }

  // Filter methods
  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm() ||
      this.selectedStatuses().length > 0 ||
      this.selectedPriorities().length > 0 ||
      this.selectedAssignees().length > 0 ||
      this.selectedTypes().length > 0
    );
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.searchTerm()) count++;
    if (this.selectedStatuses().length > 0) count++;
    if (this.selectedPriorities().length > 0) count++;
    if (this.selectedAssignees().length > 0) count++;
    if (this.selectedTypes().length > 0) count++;
    return count;
  }

  clearAllFilters(): void {
    this.searchTerm.set('');
    this.filterForm.patchValue({ searchTerm: '' });
    this.selectedAssignees.set([]);
    this.selectedStatuses.set([]);
    this.selectedPriorities.set([]);
    this.selectedTypes.set([]);
  }

  // View mode controls
  setViewMode(mode: 'cards' | 'list' | 'compact'): void {
    this.viewMode.set(mode);
  }

  // Sort controls
  setSortBy(field: string): void {
    this.sortBy.set(field);
  }

  toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  }

  // Assignee filter methods
  getVisibleAssignees(): string[] {
    return this.allAssignees().slice(0, 5); // Show first 5 assignees
  }

  getHiddenAssignees(): string[] {
    return this.allAssignees().slice(5); // Rest go in overflow menu
  }

  getHiddenAssigneesCount(): number {
    return Math.max(0, this.allAssignees().length - 5);
  }

  isAssigneeSelected(assignee: string): boolean {
    return this.selectedAssignees().includes(assignee);
  }

  toggleAssigneeSelection(assignee: string, selected: boolean): void {
    const current = this.selectedAssignees();
    if (selected && !current.includes(assignee)) {
        this.selectedAssignees.set([...current, assignee]);
    } else if (!selected && current.includes(assignee)) {
      this.selectedAssignees.set(current.filter(a => a !== assignee));
    }
  }

    // Status filter methods
  isStatusSelected(status: TaskStatus): boolean {
    return this.selectedStatuses().includes(status);
  }

  toggleStatusSelection(status: TaskStatus, selected: boolean): void {
    const current = this.selectedStatuses();
    if (selected && !current.includes(status)) {
        this.selectedStatuses.set([...current, status]);
    } else if (!selected && current.includes(status)) {
      this.selectedStatuses.set(current.filter(s => s !== status));
    }
  }

  getSelectedStatusCount(): number {
    return this.selectedStatuses().length;
  }

    // Priority filter methods
  isPrioritySelected(priority: TaskPriority): boolean {
    return this.selectedPriorities().includes(priority);
  }

  togglePrioritySelection(priority: TaskPriority, selected: boolean): void {
    const current = this.selectedPriorities();
    if (selected && !current.includes(priority)) {
        this.selectedPriorities.set([...current, priority]);
    } else if (!selected && current.includes(priority)) {
      this.selectedPriorities.set(current.filter(p => p !== priority));
    }
  }

  getSelectedPriorityCount(): number {
    return this.selectedPriorities().length;
  }

  // Type filter methods (placeholder for future use)
  isTypeSelected(type: string): boolean {
    return this.selectedTypes().includes(type);
  }

  toggleTypeSelection(type: string, selected: boolean): void {
    const current = this.selectedTypes();
    if (selected && !current.includes(type)) {
        this.selectedTypes.set([...current, type]);
    } else if (!selected && current.includes(type)) {
      this.selectedTypes.set(current.filter(t => t !== type));
    }
  }

  // Selection methods
  isSelected(task: Task): boolean {
    return this.selectedIssues().some(selected => selected.id === task.id);
  }

  toggleSelection(task: Task, selected: boolean): void {
    const current = this.selectedIssues();
    if (selected && !this.isSelected(task)) {
      this.selectedIssues.set([...current, task]);
    } else if (!selected && this.isSelected(task)) {
      this.selectedIssues.set(current.filter(t => t.id !== task.id));
    }
  }

  selectIssue(task: Task, event: MouseEvent): void {
    // Only select if not clicking on specific interactive elements
    const target = event.target as HTMLElement;
    if (!target.closest('mat-checkbox') && !target.closest('button') && !target.closest('a')) {
      this.openTaskEditor(task);
    }
  }

  isAllSelected(): boolean {
    const tasks = this.sortedAndFilteredTasks();
    return tasks.length > 0 && this.selectedIssues().length === tasks.length;
  }

  isSomeSelected(): boolean {
    const selectedCount = this.selectedIssues().length;
    return selectedCount > 0 && selectedCount < this.sortedAndFilteredTasks().length;
  }

  toggleSelectAll(selectAll: boolean): void {
    if (selectAll) {
      this.selectedIssues.set([...this.sortedAndFilteredTasks()]);
    } else {
      this.selectedIssues.set([]);
    }
  }

  // Bulk operations
  bulkDelete(): void {
    const selected = this.selectedIssues();
    if (selected.length === 0) return;
    
    const message = `Are you sure you want to delete ${selected.length} issue(s)?`;
    if (confirm(message)) {
      // TODO: Implement bulk delete
      this.snackBar.open(`Deleted ${selected.length} issue(s)`, 'OK', { duration: 3000 });
      this.selectedIssues.set([])
    }
  }

  // Individual issue operations
  duplicateIssue(task: Task): void {
    const duplicatedTask = { ...task, id: undefined, title: `Copy of ${task.title}` };
    // TODO: Implement task duplication
    this.snackBar.open('Issue duplicated', 'OK', { duration: 3000 });
  }

  deleteIssue(task: Task): void {
    if (confirm('Are you sure you want to delete this issue?')) {
      this.taskService.deleteTask(task.id!).subscribe({
        next: () => {
          this.snackBar.open('Issue deleted', 'OK', { duration: 3000 });
      this.refreshIssues();
        },
        error: (error) => {
          this.snackBar.open('Failed to delete issue', 'OK', { duration: 3000 });
          console.error('Delete error:', error);
        }
      });
    }
  }

  changeStatus(task: Task, newStatus: TaskStatus): void {
    if (task.status === newStatus || !task.id || task.version === undefined) return;

    const updateRequest = {
      id: task.id,
      title: task.title,
      summary: task.title,
      description: task.description,
      status: newStatus,
      priority: task.priority,
      assignee: task.assignee,
      estimatedHours: task.estimatedHours,
      tags: task.tags,
      version: task.version,
      updatedBy: task.updatedBy
    };

    this.taskService.updateTask(updateRequest).subscribe({
      next: () => {
        this.snackBar.open(`Issue moved to ${TaskUtils.getStatusDisplay(newStatus).displayName}`, 'OK', { duration: 3000 });
        this.refreshIssues();
      },
      error: (error) => {
        this.snackBar.open('Failed to update issue status', 'OK', { duration: 3000 });
        console.error('Status update error:', error);
      }
    });
  }

  // Task panel methods
  openTaskPanel(taskId: number): void {
    this.selectedTaskId.set(taskId);
    this.isPanelOpen.set(true);
  }

  closeTaskPanel(): void {
    this.isPanelOpen.set(false);
    this.selectedTaskId.set(null);
  }

  // Filter panel methods
  openFilterPanel(): void {
    // Get the filter button position to anchor the dialog
    const filterButton = document.querySelector('.consolidated-filter') as HTMLElement;
    const rect = filterButton?.getBoundingClientRect();
    
    // Calculate position to align right edge of panel with right edge of button
    const panelWidth = 420;
    const leftPosition = rect ? rect.right - panelWidth : 20;
    
    this.dialog.open(FilterPanelComponent, {
      width: '420px',
      maxWidth: '90vw',
      maxHeight: '50vh',
      panelClass: ['filter-dropdown-panel', 'jira-dropdown'],
      data: { taskList: this },
      position: { 
        top: rect ? `${rect.bottom + 4}px` : '120px',
        left: `${Math.max(leftPosition, 20)}px` // Ensure it doesn't go off-screen
      },
      backdropClass: 'transparent-backdrop',
      hasBackdrop: true,
      disableClose: false
    });
  }

  // Utility methods
  getPriorityIcon(priority: TaskPriority): string {
    return TaskUtils.getPriorityDisplay(priority).icon;
  }

  getPriorityLabel(priority: TaskPriority): string {
    return TaskUtils.getPriorityDisplay(priority).displayName;
  }

  getStatusLabel(status: TaskStatus): string {
    return TaskUtils.getStatusDisplay(status).displayName;
  }

  getTaskTags(tags: string | string[]): string[] {
    if (Array.isArray(tags)) {
      return tags;
    }
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    return [];
  }

  isTaskOverdue(task: Task): boolean {
    // Mock implementation - you can add actual due date logic here
    return false;
  }

  formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    // Use stable signal to prevent ExpressionChangedAfterItHasBeenCheckedError
    const nowTime = this.currentTime();
    const diffMs = nowTime - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }






  openCreateTaskModal(): void {
    const dialogRef = this.dialog.open(TaskEditorComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      data: {
        mode: 'create'
      } as TaskEditorData
    });

    dialogRef.afterClosed().subscribe(result => {
      // Always refresh the list when dialog closes to ensure consistency
      this.refreshIssues();
    });
  }

  openTaskEditor(task: Task): void {
    if (!task.id) return;
    
    const dialogRef = this.dialog.open(TaskEditorComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      data: {
        mode: 'edit',
        task: task
      } as TaskEditorData
    });

    dialogRef.afterClosed().subscribe(result => {
      // Check if task was actually updated and refresh accordingly
      if (result && typeof result === 'object' && result.id) {
        // Task was successfully updated
        this.refreshIssues();
      } else if (result === 'refresh') {
        // Explicit refresh request (e.g., after conflict resolution)
        this.refreshIssues();
      }
      // For other cases (cancel, no changes), don't refresh unnecessarily
    });
  }
} 