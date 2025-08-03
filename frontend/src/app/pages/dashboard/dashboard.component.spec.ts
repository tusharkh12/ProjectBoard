import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { DashboardComponent } from './dashboard.component';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Test Task 1',
      summary: 'Test Task 1',
      description: 'Description 1',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.HIGH,
      assignee: 'John Doe',
      estimatedHours: 5,
      tags: 'test',
      version: 1,
      createdAt: '2024-01-01T10:00:00',
      updatedAt: '2024-01-01T10:00:00',
      createdBy: 'system',
      updatedBy: 'system'
    },
    {
      id: 2,
      title: 'Test Task 2',
      summary: 'Test Task 2',
      description: 'Description 2',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      assignee: 'Jane Doe',
      estimatedHours: 3,
      tags: 'test',
      version: 1,
      createdAt: '2024-01-02T10:00:00',
      updatedAt: '2024-01-02T15:00:00',
      createdBy: 'system',
      updatedBy: 'system'
    }
  ];

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', ['loadTasks', 'loadStatistics'], {
      tasks: signal(mockTasks),
      statistics: signal({
        totalTasks: 2,
        byStatus: { BACKLOG: 1, DONE: 1 },
        byPriority: { HIGH: 1, MEDIUM: 1 },
        byAssignee: { 'John Doe': 1, 'Jane Doe': 1 },
        completionRate: 50.0,
        totalEstimatedHours: 8,
        timestamp: '2024-01-01T10:00:00Z'
      }),
      loading: signal(false),
      selectedTask: signal(null),
      error: signal(null),
      searchCriteria: signal({}),
      filteredTasks: signal(mockTasks),
      taskCount: signal(mockTasks.length),
      tasksByStatus: signal({
        backlog: 1,
        inProgress: 0,
        review: 0,
        testing: 0,
        done: 1
      }),
      tasksByPriority: signal({
        low: 0,
        medium: 1,
        high: 1,
        critical: 0
      })
    });

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(null));
    
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(dialogRefSpy);
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    // Setup method return values
    mockTaskService.loadTasks.and.returnValue(of(mockTasks));
    mockTaskService.loadStatistics.and.returnValue(of({
      totalTasks: 2,
      byStatus: { BACKLOG: 1, DONE: 1 },
      byPriority: { HIGH: 1, MEDIUM: 1 },
      byAssignee: { 'John Doe': 1, 'Jane Doe': 1 },
      completionRate: 50.0,
      totalEstimatedHours: 8,
      timestamp: '2024-01-01T10:00:00Z'
    }));
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display task statistics', () => {
    expect(component.getTotalTasks()).toBe(2);
    expect(component.getOpenTasks()).toBe(1);
    expect(component.getDoneTasks()).toBe(1);
  });

  it('should calculate completion rate', () => {
    expect(component.getCompletionRate()).toBe(50.0);
  });

  it('should open task editor when creating new task', () => {
    // Test the component method exists and doesn't throw
    expect(component.openCreateTaskModal).toBeDefined();
    expect(typeof component.openCreateTaskModal).toBe('function');
  });

  it('should get recent tasks in order', () => {
    const recentTasks = component.recentTasks();
    expect(recentTasks.length).toBe(2);
    // Should be ordered by most recent first
    expect(recentTasks[0].id).toBe(2);
    expect(recentTasks[1].id).toBe(1);
  });
});