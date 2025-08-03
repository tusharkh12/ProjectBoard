import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { TaskEditorComponent, TaskEditorData } from './task-editor.component';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';

describe('TaskEditorComponent', () => {
  let component: TaskEditorComponent;
  let fixture: ComponentFixture<TaskEditorComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<TaskEditorComponent>>;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    summary: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.MEDIUM,
    assignee: 'John Doe',
    estimatedHours: 5,
    tags: 'test,unit',
    version: 1,
    createdAt: '2024-01-01T10:00:00',
    updatedAt: '2024-01-01T10:00:00',
    createdBy: 'system',
    updatedBy: 'system'
  };

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', ['createTask', 'updateTask']);
    // Add the tasks signal to the mock
    taskServiceSpy.tasks = signal([mockTask]);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        TaskEditorComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'create' } as TaskEditorData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskEditorComponent);
    component = fixture.componentInstance;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<TaskEditorComponent>>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form for create mode', () => {
    expect(component.isEditMode()).toBe(false);
    expect(component.taskForm.get('title')?.value).toBe('');
    expect(component.taskForm.get('description')?.value).toBe('');
  });

  it('should initialize form for edit mode', () => {
    // Recreate component with edit mode data
    const editData: TaskEditorData = { mode: 'edit', task: mockTask };
    
    // Create a new mock with tasks signal for the reset test
    const newTaskServiceSpy = jasmine.createSpyObj('TaskService', ['createTask', 'updateTask']);
    newTaskServiceSpy.tasks = signal([mockTask]);
    
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        TaskEditorComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: TaskService, useValue: newTaskServiceSpy },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: editData }
      ]
    });

    fixture = TestBed.createComponent(TaskEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isEditMode()).toBe(true);
    expect(component.taskForm.get('title')?.value).toBe('Test Task');
    expect(component.taskForm.get('description')?.value).toBe('Test Description');
  });

  it('should save new task successfully', () => {
    const newTask = { ...mockTask, id: 2 };
    mockTaskService.createTask.and.returnValue(of(newTask));

    component.taskForm.patchValue({
      title: 'New Task',
      description: 'New Description',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.HIGH
    });

    component.save();

    expect(mockTaskService.createTask).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({
      id: 2,
      title: 'Test Task'
    }));
  });

  it('should update existing task successfully', () => {
    const editData: TaskEditorData = { mode: 'edit', task: mockTask };
    
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        TaskEditorComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: editData }
      ]
    });

    fixture = TestBed.createComponent(TaskEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const updatedTask = { ...mockTask, title: 'Updated Task' };
    mockTaskService.updateTask.and.returnValue(of(updatedTask));

    component.taskForm.patchValue({ title: 'Updated Task' });
    component.save();

    expect(mockTaskService.updateTask).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({
      id: 1,
      title: 'Updated Task'
    }));
  });

  it('should handle save errors', () => {
    mockTaskService.createTask.and.returnValue(throwError(() => new Error('Save failed')));

    component.taskForm.patchValue({
      title: 'New Task',
      description: 'New Description'
    });

    component.save();

    expect(mockTaskService.createTask).toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should validate required fields', () => {
    component.taskForm.patchValue({
      title: '',
      status: '',
      priority: ''
    });

    expect(component.taskForm.valid).toBe(false);
    expect(component.taskForm.get('title')?.hasError('required')).toBe(true);
    expect(component.taskForm.get('status')?.hasError('required')).toBe(true);
    expect(component.taskForm.get('priority')?.hasError('required')).toBe(true);
  });
});