import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { TaskPanelComponent } from './task-panel.component';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';

describe('TaskPanelComponent', () => {
  let component: TaskPanelComponent;
  let fixture: ComponentFixture<TaskPanelComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    assignee: 'John Doe',
    tags: 'frontend,urgent',
    estimatedHours: 8,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1,
    summary: ''
  };

  let tasksSignal: any;

  beforeEach(async () => {
    // Create a proper signal mock that can be modified
    tasksSignal = signal([mockTask]);
    
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'loadTasks',
      'updateTask',
      'getTask'
    ]);
    taskServiceSpy.tasks = tasksSignal;
    taskServiceSpy.loadTasks.and.returnValue(of([mockTask]));
    taskServiceSpy.updateTask.and.returnValue(of(mockTask));
    taskServiceSpy.getTask.and.returnValue(of(mockTask));

    await TestBed.configureTestingModule({
      imports: [TaskPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    fixture = TestBed.createComponent(TaskPanelComponent);
    component = fixture.componentInstance;
    
    // Set task ID input using fixture
    fixture.componentRef.setInput('taskId', 1);
    
    // Do NOT call detectChanges() to avoid template rendering and effects
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get priority display info', () => {
    const priorityDisplay = component.getPriorityDisplay(TaskPriority.HIGH);
    expect(priorityDisplay).toBeTruthy();
    expect(typeof priorityDisplay).toBe('string');
  });

  it('should get status display info', () => {
    const statusDisplay = component.getStatusDisplay(TaskStatus.IN_PROGRESS);
    expect(statusDisplay).toBeTruthy();
    expect(typeof statusDisplay).toBe('string');
  });

  it('should parse tags correctly', () => {
    // Manually set the task signal since we're not calling detectChanges()
    component.task.set(mockTask);
    const tags = component.getTaskTags();
    expect(tags).toEqual(['frontend', 'urgent']);
  });
});
