import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority, TaskUtils, TaskStatistics, IssueUtils } from '../../models/task.model';

import { TaskPanelComponent } from '../../components/task-panel/task-panel.component';
import { TaskEditorComponent, TaskEditorData } from '../../components/task-editor/task-editor.component';

/**
 * Executive-Grade Dashboard Component
 * 
 * Features:
 * - KPI overview cards with real metrics
 * - Status distribution with progress indicators
 * - Priority breakdown with visual charts
 * - Assignee performance leaderboard
 * - Completion rate tracking
 * - Recent activity summary
 * - Professional YouTrack/Jira-style design
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    TaskPanelComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  public readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  readonly TaskPriority = TaskPriority;
  readonly IssueUtils = IssueUtils;

  // Component state  
  readonly loading = signal(false);
  readonly statistics = computed(() => this.taskService.statistics());

  // Task panel state
  readonly selectedTaskId = signal<number | null>(null);
  readonly isPanelOpen = signal(false);

  readonly statusList = signal([
    { status: TaskStatus.BACKLOG, displayName: TaskUtils.getStatusDisplay(TaskStatus.BACKLOG).displayName },
    { status: TaskStatus.IN_PROGRESS, displayName: TaskUtils.getStatusDisplay(TaskStatus.IN_PROGRESS).displayName },
    { status: TaskStatus.REVIEW, displayName: TaskUtils.getStatusDisplay(TaskStatus.REVIEW).displayName },
    { status: TaskStatus.TESTING, displayName: TaskUtils.getStatusDisplay(TaskStatus.TESTING).displayName },
    { status: TaskStatus.DONE, displayName: TaskUtils.getStatusDisplay(TaskStatus.DONE).displayName }
  ]);

  readonly priorityList = signal([
    { priority: TaskPriority.CRITICAL, displayName: TaskUtils.getPriorityDisplay(TaskPriority.CRITICAL).displayName },
    { priority: TaskPriority.HIGH, displayName: TaskUtils.getPriorityDisplay(TaskPriority.HIGH).displayName },
    { priority: TaskPriority.MEDIUM, displayName: TaskUtils.getPriorityDisplay(TaskPriority.MEDIUM).displayName },
    { priority: TaskPriority.LOW, displayName: TaskUtils.getPriorityDisplay(TaskPriority.LOW).displayName }
  ]);

  readonly recentTasks = computed(() => {
    const tasks = this.taskService.filteredTasks();
    
    // Sort by updatedAt timestamp (most recent first) and take top 6
    return tasks
      .slice() // Create copy to avoid mutating original array
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || new Date()).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || new Date()).getTime();
        return dateB - dateA; // Most recent first
      })
      .slice(0, 6);
  });

  ngOnInit(): void {
    this.refreshDashboard();
  }

  refreshDashboard(): void {
    this.loading.set(true);
    
    // Load tasks and statistics in parallel
    Promise.all([
      this.taskService.loadTasks().toPromise(),
      this.taskService.loadStatistics().toPromise()
    ]).finally(() => {
      this.loading.set(false);
    });
  }

  // KPI Methods
  getTotalTasks(): number {
    return this.taskService.taskCount();
  }

  getOpenTasks(): number {
    return this.taskService.tasksByStatus().backlog;
  }

  getInProgressTasks(): number {
    return this.taskService.tasksByStatus().inProgress;
  }

  getCodeReviewTasks(): number {
    return this.taskService.tasksByStatus().review;
  }

  getTestingTasks(): number {
    return this.taskService.tasksByStatus().testing;
  }

  getDoneTasks(): number {
    return this.taskService.tasksByStatus().done;
  }

  getCompletionRate(): number {
    const total = this.getTotalTasks();
    if (total === 0) return 0;
    return Math.round((this.getDoneTasks() / total) * 100);
  }

  getOpenPercentage(): number {
    const total = this.getTotalTasks();
    if (total === 0) return 0;
    return Math.round((this.getOpenTasks() / total) * 100);
  }

  getInProgressPercentage(): number {
    const total = this.getTotalTasks();
    if (total === 0) return 0;
    return Math.round((this.getInProgressTasks() / total) * 100);
  }

  getCodeReviewPercentage(): number {
    const total = this.getTotalTasks();
    if (total === 0) return 0;
    return Math.round((this.getCodeReviewTasks() / total) * 100);
  }

  getTestingPercentage(): number {
    const total = this.getTotalTasks();
    if (total === 0) return 0;
    return Math.round((this.getTestingTasks() / total) * 100);
  }

  getEstimatedHours(): number {
    const tasks = this.taskService.filteredTasks();
    return Math.round(tasks.reduce((total, task) => total + (task.estimatedHours || 0), 0));
  }

     // Priority Statistics
   getPriorityStats(): any[] {
     const total = this.getTotalTasks();
     if (total === 0) return [];

     const priorityData = this.taskService.tasksByPriority();

     return [
       TaskPriority.CRITICAL,
       TaskPriority.HIGH,
       TaskPriority.MEDIUM,
       TaskPriority.LOW
     ].map(priority => {
       let count = 0;
       switch (priority) {
         case TaskPriority.CRITICAL:
           count = priorityData.critical;
           break;
         case TaskPriority.HIGH:
           count = priorityData.high;
           break;
         case TaskPriority.MEDIUM:
           count = priorityData.medium;
           break;
         case TaskPriority.LOW:
           count = priorityData.low;
           break;
       }
       
       const percentage = Math.round((count / total) * 100);
       const display = TaskUtils.getPriorityDisplay(priority);
       
       return {
         name: priority,
         displayName: display.displayName,
         icon: display.icon,
         count,
         percentage
       };
     });
   }

  // Team Statistics
  getTeamStats(): any[] {
    const tasks = this.taskService.filteredTasks();
    const assigneeCounts = new Map<string, number>();
    
    tasks.forEach(task => {
      if (task.assignee) {
        assigneeCounts.set(task.assignee, (assigneeCounts.get(task.assignee) || 0) + 1);
      }
    });

    const total = Array.from(assigneeCounts.values()).reduce((sum, count) => sum + count, 0);
    if (total === 0) return [];

    return Array.from(assigneeCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 assignees
  }

  // Health Metrics
  getVelocity(): string {
    const tasks = this.taskService.filteredTasks();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Count tasks completed (moved to DONE) in the past week
    const tasksCompletedThisWeek = tasks.filter(task => {
      if (task.status !== TaskStatus.DONE) return false;
      
      const updatedDate = new Date(task.updatedAt || task.createdAt || new Date());
      return updatedDate >= oneWeekAgo;
    }).length;
    
            return `${tasksCompletedThisWeek} tasks/week`;
  }

  getVelocityCompletionRate(): number {
    const total = this.getTotalTasks();
    if (total === 0) return 0;
    
    const done = this.getDoneTasks();
    const inProgress = this.getInProgressTasks();
    const review = this.getCodeReviewTasks();
    const testing = this.getTestingTasks();
    
    // Calculate weighted completion percentage
    // Done: 100%, Testing: 80%, Review: 50%, In Progress: 20%, Backlog: 0%
    const weightedProgress = (done * 100) + (testing * 80) + (review * 50) + (inProgress * 20);
    const maxPossible = total * 100;
    
    return Math.round((weightedProgress / maxPossible) * 100);
  }

  getBottleneckCount(): number {
    // Mock bottleneck detection - tasks stuck in review/testing
    return this.getCodeReviewTasks() + this.getTestingTasks();
  }

  getHealthStatus(metric: string): string {
    switch (metric) {
      case 'completion':
        const completion = this.getCompletionRate();
        if (completion >= 80) return 'excellent';
        if (completion >= 60) return 'good';
        if (completion >= 40) return 'warning';
        return 'poor';
      
      case 'velocity':
        // Calculate velocity as a percentage based on total project progress
        const velocityCompletion = this.getVelocityCompletionRate();
        if (velocityCompletion >= 75) return 'excellent';  // 75-100%
        if (velocityCompletion >= 50) return 'good';       // 50-74%
        if (velocityCompletion >= 25) return 'warning';    // 25-49%
        return 'poor';                                      // 0-24%
      
      case 'bottleneck':
        const bottlenecks = this.getBottleneckCount();
        const total = this.getTotalTasks();
        const ratio = total > 0 ? (bottlenecks / total) * 100 : 0;
        if (ratio <= 10) return 'excellent';
        if (ratio <= 20) return 'good';
        if (ratio <= 30) return 'warning';
        return 'poor';
      
      default:
        return 'good';
    }
  }

  getHealthLabel(metric: string): string {
    const status = this.getHealthStatus(metric);
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'warning': return 'Needs Attention';
      case 'poor': return 'Critical';
      default: return 'Unknown';
    }
  }

  // Utility Methods
  getStatusDisplay(status: TaskStatus): string {
    return TaskUtils.getStatusDisplay(status).displayName;
  }

  getPriorityIcon(priority: TaskPriority): string {
    return TaskUtils.getPriorityDisplay(priority).icon;
  }

  formatTimestamp(timestamp: any): string {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  openTaskDetail(task: Task): void {
    this.openTaskEditor(task);
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
        // Task was updated successfully, refresh the dashboard
        this.refreshDashboard();
      }
    });
  }

  closeTaskPanel(): void {
    this.isPanelOpen.set(false);
    this.selectedTaskId.set(null);
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
      if (result) {
        // Task was created successfully, refresh the dashboard
        this.refreshDashboard();
      }
    });
  }
} 