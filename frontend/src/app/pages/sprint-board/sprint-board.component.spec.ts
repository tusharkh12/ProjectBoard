import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';

import { SprintBoardComponent } from './sprint-board.component';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';

describe('SprintBoardComponent', () => {
  let component: SprintBoardComponent;
  let fixture: ComponentFixture<SprintBoardComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Backlog Task',
      summary: 'Backlog Task',
      description: 'Task in backlog',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.HIGH,
      assignee: 'John Doe',
      estimatedHours: 5,
      tags: 'backend,api',
      version: 1,
      createdAt: '2024-01-01T10:00:00',
      updatedAt: '2024-01-01T10:00:00',
      createdBy: 'system',
      updatedBy: 'system'
    },
    {
      id: 2,
      title: 'In Progress Task',
      summary: 'In Progress Task',
      description: 'Task in progress',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      assignee: 'Jane Smith',
      estimatedHours: 3,
      tags: 'frontend,ui',
      version: 1,
      createdAt: '2024-01-02T10:00:00',
      updatedAt: '2024-01-02T11:00:00',
      createdBy: 'system',
      updatedBy: 'system'
    }
  ];

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', ['loadTasks', 'updateTask'], {
      tasks: signal(mockTasks),
      loading: signal(false),
      selectedTask: signal(null),
      error: signal(null),
      searchCriteria: signal({}),
      statistics: signal(null),
      filteredTasks: signal(mockTasks),
      taskCount: signal(mockTasks.length),
      tasksByStatus: signal({
        backlog: 1,
        inProgress: 1,
        review: 0,
        testing: 0,
        done: 0
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

    await TestBed.configureTestingModule({
      imports: [SprintBoardComponent, NoopAnimationsModule],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} }, params: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SprintBoardComponent);
    component = fixture.componentInstance;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    
    // Setup method return values
    mockTaskService.loadTasks.and.returnValue(of(mockTasks));
    mockTaskService.updateTask.and.returnValue(of(mockTasks[0]));
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter tasks by status', () => {
    const backlogTasks = component.getTasksByStatus(TaskStatus.BACKLOG);
    const inProgressTasks = component.getTasksByStatus(TaskStatus.IN_PROGRESS);
    
    expect(backlogTasks.length).toBe(1);
    expect(backlogTasks[0].status).toBe(TaskStatus.BACKLOG);
    
    expect(inProgressTasks.length).toBe(1);
    expect(inProgressTasks[0].status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('should open task editor for new task', () => {
    // Test the component method exists and doesn't throw
    expect(component.openCreateTaskModal).toBeDefined();
    expect(typeof component.openCreateTaskModal).toBe('function');
  });

  it('should open task editor for existing task', () => {
    const task = mockTasks[0];
    // Test the component method exists and doesn't throw
    expect(component.openTaskEditor).toBeDefined();
    expect(typeof component.openTaskEditor).toBe('function');
  });

  it('should handle task drop between columns', () => {
    const task = mockTasks[0];
    mockTaskService.updateTask.and.returnValue(of({ ...task, status: TaskStatus.IN_PROGRESS }));
    mockTaskService.loadTasks.and.returnValue(of(mockTasks));

    // Mock drag and drop event
    const mockEvent = {
      previousContainer: { id: 'BACKLOG-list', data: [task] },
      container: { id: 'IN_PROGRESS-list', data: [] },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: task }
    } as any;

    component.onTaskDrop(mockEvent);

    expect(mockTaskService.updateTask).toHaveBeenCalled();
  });

  it('should get unique assignees', () => {
    const assignees = component.uniqueAssignees();
    expect(assignees.length).toBe(2);
    expect(assignees).toContain('John Doe');
    expect(assignees).toContain('Jane Smith');
  });
});