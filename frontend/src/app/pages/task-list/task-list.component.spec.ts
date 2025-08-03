import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { TaskListComponent } from './task-list.component';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Test Task 1',
      description: 'Test Description 1',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.HIGH,
      assignee: 'John Doe',
      tags: 'frontend,bug',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      version: 1,
      summary: ''
    },
    {
      id: 2,
      title: 'Test Task 2',
      description: 'Test Description 2',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      assignee: 'Jane Smith',
      tags: 'backend,feature',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      version: 1,
      summary: ''
    }
  ];

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'loadTasks',
      'updateTask',
      'deleteTask'
    ]);
    taskServiceSpy.tasks = signal(mockTasks);
    taskServiceSpy.filteredTasks = signal(mockTasks);
    taskServiceSpy.loading = signal(false);
    taskServiceSpy.error = signal(null);
    taskServiceSpy.taskCount = signal(mockTasks.length);
    taskServiceSpy.loadTasks.and.returnValue(of(mockTasks));
    taskServiceSpy.updateTask.and.returnValue(of(mockTasks[0]));
    taskServiceSpy.deleteTask.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [TaskListComponent, NoopAnimationsModule],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', () => {
    expect(mockTaskService.loadTasks).toHaveBeenCalled();
  });

  it('should filter tasks correctly', () => {
    component.selectedStatuses.set([TaskStatus.BACKLOG]);
    const filteredTasks = component.sortedAndFilteredTasks();
    expect(filteredTasks.length).toBe(1);
    expect(filteredTasks[0].status).toBe(TaskStatus.BACKLOG);
  });

  it('should sort tasks by different criteria', () => {
    component.setSortBy('title');
    component.sortDirection.set('asc');
    const sortedTasks = component.sortedAndFilteredTasks();
    // "Test Task 1" should come before "Test Task 2" alphabetically
    expect(sortedTasks[0].title).toBe('Test Task 1');
    expect(sortedTasks[1].title).toBe('Test Task 2');
  });

  it('should handle assignee filtering', () => {
    component.toggleAssigneeSelection('John Doe', true);
    expect(component.isAssigneeSelected('John Doe')).toBe(true);
    
    const filteredTasks = component.sortedAndFilteredTasks();
    expect(filteredTasks.length).toBe(1);
    expect(filteredTasks[0].assignee).toBe('John Doe');
  });

  it('should handle priority filtering', () => {
    component.togglePrioritySelection(TaskPriority.HIGH, true);
    expect(component.isPrioritySelected(TaskPriority.HIGH)).toBe(true);
    
    const filteredTasks = component.sortedAndFilteredTasks();
    expect(filteredTasks.length).toBe(1);
    expect(filteredTasks[0].priority).toBe(TaskPriority.HIGH);
  });

  it('should clear all filters', () => {
    component.selectedStatuses.set([TaskStatus.BACKLOG]);
    component.selectedPriorities.set([TaskPriority.HIGH]);
    component.selectedAssignees.set(['John Doe']);
    
    component.clearAllFilters();
    
    expect(component.selectedStatuses()).toEqual([]);
    expect(component.selectedPriorities()).toEqual([]);
    expect(component.selectedAssignees()).toEqual([]);
  });

  it('should handle search filtering', () => {
    const searchEvent = { target: { value: 'Task' } } as any;
    component.updateSearch(searchEvent);
    
    const filteredTasks = component.sortedAndFilteredTasks();
    // Both tasks contain "Task" so should return both
    expect(filteredTasks.length).toBe(2);
    // The first task returned should be Test Task 2 (based on current behavior)
    expect(filteredTasks[0].title).toBe('Test Task 2');
  });

  it('should change task status', () => {
    const task = mockTasks[0];
    component.changeStatus(task, TaskStatus.DONE);
    
    expect(mockTaskService.updateTask).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: task.id,
        status: TaskStatus.DONE
      })
    );
  });

  it('should delete task', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const task = mockTasks[0];
    
    component.deleteIssue(task);
    
    expect(mockTaskService.deleteTask).toHaveBeenCalledWith(task.id!);
  });

  it('should handle view mode changes', () => {
    component.setViewMode('list');
    expect(component.viewMode()).toBe('list');
    
    component.setViewMode('compact');
    expect(component.viewMode()).toBe('compact');
  });

  it('should toggle sort direction', () => {
    const initialDirection = component.sortDirection();
    component.toggleSortDirection();
    expect(component.sortDirection()).toBe(initialDirection === 'asc' ? 'desc' : 'asc');
  });

  it('should detect active filters correctly', () => {
    expect(component.hasActiveFilters()).toBe(false);
    
    component.selectedStatuses.set([TaskStatus.BACKLOG]);
    expect(component.hasActiveFilters()).toBe(true);
  });

  it('should count active filters correctly', () => {
    expect(component.getActiveFilterCount()).toBe(0);
    
    component.selectedStatuses.set([TaskStatus.BACKLOG]);
    component.selectedPriorities.set([TaskPriority.HIGH]);
    expect(component.getActiveFilterCount()).toBe(2);
  });
});
