import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';
import { TaskUtils, IssueUtils } from '../../models/task.model';
import { TaskPanelComponent } from '../../components/task-panel/task-panel.component';
import { TaskEditorComponent, TaskEditorData } from '../../components/task-editor/task-editor.component';

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
    DragDropModule,
    TaskPanelComponent
  ],
  templateUrl: './sprint-board.component.html',
  styleUrls: ['./sprint-board.component.scss']
})
export class SprintBoardComponent implements OnInit {
  readonly taskService = inject(TaskService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  // Expose for template
  readonly TaskStatus = TaskStatus;
  readonly TaskPriority = TaskPriority;
  readonly IssueUtils = IssueUtils;

  // Filter form
  readonly filterForm: FormGroup = this.fb.group({
    searchTerm: [''],
    assignee: [''],
    priority: ['']
  });

  // Kanban column configuration
  readonly kanbanStatuses = signal([
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

  // Multi-select filter states
  readonly selectedAssignees = signal<string[]>([]);
  readonly selectedPriorities = signal<TaskPriority[]>([]);

  // Sort and view options
  readonly currentSort = signal<string>('created');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly showIssueIds = signal(true);
  readonly showEstimates = signal(true);
  readonly showAvatars = signal(true);

  // Task panel state
  readonly selectedTaskId = signal<number | null>(null);
  readonly isPanelOpen = signal(false);

  readonly sortOptions = signal([
    { value: 'created', label: 'Created Date', icon: 'schedule' },
    { value: 'updated', label: 'Updated Date', icon: 'update' },
    { value: 'priority', label: 'Priority', icon: 'flag' },
    { value: 'title', label: 'Title', icon: 'sort_by_alpha' },
    { value: 'assignee', label: 'Assignee', icon: 'person' },
    { value: 'status', label: 'Status', icon: 'assignment' }
  ]);

  // Computed signals
  readonly getHighPriorityCount = computed(() => {
    return this.taskService.filteredTasks()
      .filter(task => task.priority === TaskPriority.HIGH || task.priority === TaskPriority.CRITICAL)
      .length;
  });

  // Computed properties
  // Unique assignees should come from the FULL data set so the avatar stack never disappears when we filter.
  readonly uniqueAssignees = computed(() => {
    const assignees = this.taskService.tasks()
        .map(task => task.assignee)
        .filter(assignee => assignee && assignee.trim())
        // de-duplicate
        .filter((assignee, index, array) => array.indexOf(assignee) === index);
    return assignees as string[];
  });

  constructor() {
    // Set up filter form subscription
    this.filterForm.valueChanges.subscribe(filters => {
      this.taskService.updateSearchCriteria({
        searchTerm: filters.searchTerm || '',
        assignee: filters.assignee || '',
        priority: filters.priority || ''
      });
    });
  }

  ngOnInit(): void {
    // If we already have tasks but loading is still true, clear it
    if (this.taskService.tasks().length > 0 && this.taskService.loading()) {
      this.taskService.clearLoadingState();
    }
    
    // Ensure we have tasks loaded
    if (this.taskService.tasks().length === 0) {
      this.refreshBoard();
    }
    
    // Safety timeout to clear loading state if it gets stuck
    setTimeout(() => {
      if (this.taskService.loading()) {
        this.taskService.clearLoadingState();
      }
    }, 5000);
  }

  refreshBoard(): void {
    this.taskService.loadTasks().subscribe({
      next: (tasks) => {
        // Board refreshed successfully
      },
      error: (error) => {
        this.snackBar.open(`Error refreshing board: ${error.message}`, 'Close', { duration: 5000 });
      }
    });
  }

  updateSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.filterForm.patchValue({ searchTerm });
    this.updateFiltersFromSelections();
  }

  clearSearch(): void {
    this.filterForm.patchValue({ searchTerm: '' });
    this.updateFiltersFromSelections();
  }

  setAssigneeFilter(assignee: string): void {
    this.filterForm.patchValue({ assignee });
  }

  setPriorityFilter(priority: string): void {
    this.filterForm.patchValue({ priority });
  }

  hasActiveFilters(): boolean {
    const form = this.filterForm.value;
    return !!(form.searchTerm || 
              this.selectedAssignees().length > 0 || 
              this.selectedPriorities().length > 0);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.selectedAssignees.set([]);
    this.selectedPriorities.set([]);
    this.updateFiltersFromSelections();
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    const allTasks = this.taskService.filteredTasks();
    const statusTasks = allTasks.filter(task => task.status === status);
    
    // First apply saved manual order, then other sorting if no manual order exists
    const orderedTasks = this.applySavedOrder([...statusTasks], status);
    
    // If there's a saved order, use it; otherwise apply default sorting
    const hasManualOrder = Object.keys(this.loadColumnOrder(status)).length > 0;
    return hasManualOrder ? orderedTasks : this.sortTasks(orderedTasks);
  }

  getDropListId(status: TaskStatus): string {
    return `kanban-list-${status}`;
  }

  getAllDropListIds(): string[] {
    return this.kanbanStatuses().map(status => this.getDropListId(status.value));
  }

  onTaskDrop(event: CdkDragDrop<Task[]>): void {
    const previousStatus = this.getStatusFromDropList(event.previousContainer.id);
    const newStatus = this.getStatusFromDropList(event.container.id);
    const task = event.item.data;

    if (previousStatus === newStatus) {
      // Reorder within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.saveColumnOrder(newStatus, event.container.data);
    } else {
      // Transfer to a new column
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.updateTaskStatus(task, newStatus);
      // Save order for both columns
      this.saveColumnOrder(previousStatus, event.previousContainer.data);
      this.saveColumnOrder(newStatus, event.container.data);
    }
  }

  private getStatusFromDropList(dropListId: string): TaskStatus {
    const statusString = dropListId.replace('kanban-list-', '');
    return statusString as TaskStatus;
  }

  // Column Ordering Methods for Persistent Reordering
  private saveColumnOrder(status: TaskStatus, tasks: Task[]): void {
    const orderMap: { [key: number]: number } = {};
    tasks.forEach((task, index) => {
      if (task.id) {
        orderMap[task.id] = index;
      }
    });
    
    localStorage.setItem(`kanban-order-${status}`, JSON.stringify(orderMap));
  }

  private loadColumnOrder(status: TaskStatus): { [key: number]: number } {
    const stored = localStorage.getItem(`kanban-order-${status}`);
    return stored ? JSON.parse(stored) : {};
  }

  private applySavedOrder(tasks: Task[], status: TaskStatus): Task[] {
    const orderMap = this.loadColumnOrder(status);
    
    // If no saved order, return tasks as-is
    if (Object.keys(orderMap).length === 0) {
      return tasks;
    }

    // Sort tasks based on saved positions
    return [...tasks].sort((a, b) => {
      const posA = orderMap[a.id || 0] ?? 999; // Default to end if not found
      const posB = orderMap[b.id || 0] ?? 999;
      return posA - posB;
    });
  }

  // Method to clear custom order for a specific status
  clearCustomOrder(status: TaskStatus): void {
    localStorage.removeItem(`kanban-order-${status}`);
  }

  // Method to check if a status has custom ordering
  hasCustomOrder(status: TaskStatus): boolean {
    return Object.keys(this.loadColumnOrder(status)).length > 0;
  }

  private updateTaskStatus(task: Task, newStatus: TaskStatus): void {
    if (!task.id) return;

    this.taskService.updateTask({
      id: task.id,
      title: task.title,
      summary: task.title,
      description: task.description,
      status: newStatus,
      priority: task.priority,
      assignee: task.assignee,
      estimatedHours: task.estimatedHours,
      tags: task.tags,
      version: task.version || 0
    }).subscribe({
      next: () => {
        const statusDisplay = TaskUtils.getStatusDisplay(newStatus).displayName;
        this.snackBar.open(`Issue moved to ${statusDisplay}`, 'Close', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        this.refreshBoard();
        if (error.error && error.error.error === 'OPTIMISTIC_LOCK_CONFLICT') {
          this.handleOptimisticLockConflict(error.error);
        } else {
          this.snackBar.open(`Failed to update issue status: ${error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        }
      }
    });
  }

  private handleOptimisticLockConflict(errorResponse: any): void {
    const currentTask = errorResponse.currentTaskData;
    this.snackBar.open(
      `Conflict detected! Issue "${currentTask.title}" was modified by another user.`,
      'Refresh',
      { duration: 10000 }
    ).onAction().subscribe(() => {
      this.refreshBoard();
    });
  }

  addTaskToColumn(status: TaskStatus): void {
    this.openCreateTaskModal(status);
  }

  configureColumn(status: TaskStatus): void {
    this.snackBar.open(`Configure '${TaskUtils.getStatusDisplay(status).displayName}' column`, 'Close', { duration: 2000 });
  }



  openTaskPanel(task: Task): void {
    if (!task.id) return;
    this.selectedTaskId.set(task.id);
    this.isPanelOpen.set(true);
  }

  closeTaskPanel(): void {
    this.isPanelOpen.set(false);
    this.selectedTaskId.set(null);
  }

  duplicateTask(task: Task): void {
    this.snackBar.open(`Duplicate issue: ${task.title}`, 'Close', { duration: 2000 });
  }

  deleteTask(task: Task): void {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      // Implement delete logic
      this.snackBar.open(`Issue deleted: ${task.title}`, 'Close', { duration: 2000 });
    }
  }

  getTaskTags(tags: string | undefined): readonly string[] {
    return TaskUtils.parseTags(tags);
  }

  getPriorityDisplay(priority: TaskPriority): string {
    return TaskUtils.getPriorityDisplay(priority).displayName;
  }

  getPriorityIcon(priority: TaskPriority): string {
    const iconMap = {
      [TaskPriority.CRITICAL]: 'error',
      [TaskPriority.HIGH]: 'keyboard_arrow_up',
      [TaskPriority.MEDIUM]: 'remove',
      [TaskPriority.LOW]: 'keyboard_arrow_down'
    };
    return iconMap[priority];
  }

  isTaskOverdue(task: Task): boolean {
    return TaskUtils.isOverdue(task);
  }

  // Atlassian-style avatar stack methods (matching Issues page)
  getVisibleAssignees(): string[] {
    const assignees = this.uniqueAssignees();
    return assignees.slice(0, 5);
  }

  getHiddenAssigneesCount(): number {
    const allAssignees = this.uniqueAssignees();
    const visibleCount = this.getVisibleAssignees().length;
    return Math.max(0, allAssignees.length - visibleCount);
  }

  getHiddenAssignees(): string[] {
    const allAssignees = this.uniqueAssignees();
    const visibleAssignees = this.getVisibleAssignees();
    return allAssignees.filter(assignee => !visibleAssignees.includes(assignee));
  }

  isAssigneeSelected(assignee: string): boolean {
    return this.selectedAssignees().includes(assignee);
  }

  toggleAssigneeSelection(assignee: string, checked: boolean): void {
    const current = this.selectedAssignees();
    if (checked) {
      if (!current.includes(assignee)) {
        this.selectedAssignees.set([...current, assignee]);
      }
    } else {
      this.selectedAssignees.set(current.filter(a => a !== assignee));
    }
    this.updateFiltersFromSelections();
  }

  getSelectedPriorityCount(): number {
    return this.selectedPriorities().length;
  }

  isPrioritySelected(priority: string): boolean {
    return this.selectedPriorities().includes(priority as TaskPriority);
  }

  togglePrioritySelection(priority: string, checked: boolean): void {
    const priorityEnum = priority as TaskPriority;
    const current = this.selectedPriorities();
    if (checked) {
      if (!current.includes(priorityEnum)) {
        this.selectedPriorities.set([...current, priorityEnum]);
      }
    } else {
      this.selectedPriorities.set(current.filter(p => p !== priorityEnum));
    }
    this.updateFiltersFromSelections();
  }

  private updateFiltersFromSelections(): void {
    const searchCriteria = {
      searchTerm: this.filterForm.get('searchTerm')?.value || '',
      // Clear legacy single filters
      assignee: undefined,
      status: undefined,  
      priority: undefined,
      // Multi-select filters
      selectedAssignees: this.selectedAssignees().length > 0 ? this.selectedAssignees() : undefined,
      selectedPriorities: this.selectedPriorities().length > 0 ? this.selectedPriorities() : undefined
    };
     
    this.taskService.updateSearchCriteria(searchCriteria);
  }

  // Sort and view methods
  getCurrentSortLabel(): string {
    const option = this.sortOptions().find(opt => opt.value === this.currentSort());
    return option ? option.label : 'Created Date';
  }

  setSortOption(sortBy: string): void {
    this.currentSort.set(sortBy);
    this.applySorting();
  }

  toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    this.applySorting();
  }

  private applySorting(): void {
    // In a real app, you'd pass sort parameters to the task service
    // For now, we'll sort the tasks client-side in getTasksByStatus
    console.log('Applying sort:', this.currentSort(), this.sortDirection());
  }

  private sortTasks(tasks: Task[]): Task[] {
    const sortBy = this.currentSort();
    const direction = this.sortDirection();
    
    return tasks.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created':
          comparison = new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
          break;
        case 'updated':
          comparison = new Date(a.updatedAt || '').getTime() - new Date(b.updatedAt || '').getTime();
          break;
        case 'priority':
          const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'assignee':
          comparison = (a.assignee || '').localeCompare(b.assignee || '');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = (a.id || 0) - (b.id || 0);
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  getFilteredCount(): number {
    return this.taskService.filteredTasks().length;
  }

  getTotalCount(): number {
    return this.taskService.taskCount();
  }

  toggleIssueIds(show: boolean): void {
    this.showIssueIds.set(show);
  }

  toggleEstimates(show: boolean): void {
    this.showEstimates.set(show);
  }

  toggleAvatars(show: boolean): void {
    this.showAvatars.set(show);
  }

  resetBoardSettings(): void {
    this.showIssueIds.set(true);
    this.showEstimates.set(true);
    this.showAvatars.set(true);
    this.currentSort.set('created');
    this.sortDirection.set('desc');
    this.applySorting();
  }

  openCreateTaskModal(preselectedStatus?: TaskStatus): void {
    const dialogRef = this.dialog.open(TaskEditorComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      data: {
        mode: 'create',
        preselectedStatus
      } as TaskEditorData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Task was created successfully, refresh the board
        this.refreshBoard();
      }
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
      if (result) {
        // Task was updated successfully, refresh the board
        this.refreshBoard();
      }
    });
  }
}