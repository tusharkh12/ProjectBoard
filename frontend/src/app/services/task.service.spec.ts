import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest } from '../models/task.model';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    summary: 'Test Task Summary',
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Handle automatic constructor requests
    const constructorTasksReq = httpMock.expectOne('http://localhost:8080/api/tasks');
    constructorTasksReq.flush([]);
    
    const constructorStatsReq = httpMock.expectOne('http://localhost:8080/api/tasks/statistics');
    constructorStatsReq.flush({
      totalTasks: 0,
      byStatus: {},
      byPriority: {},
      byAssignee: {},
      completionRate: 0,
      totalEstimatedHours: 0,
      timestamp: '2024-01-01T10:00:00Z'
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all tasks', () => {
    const mockTasks = [mockTask];

    service.loadTasks().subscribe(tasks => {
      expect(tasks.length).toBe(1);
      expect(tasks[0]).toEqual(jasmine.objectContaining({
        id: mockTask.id,
        title: mockTask.title,
        description: mockTask.description,
        status: mockTask.status,
        priority: mockTask.priority,
        issueId: jasmine.any(String)
      }));
    });

    const req = httpMock.expectOne('http://localhost:8080/api/tasks');
    expect(req.request.method).toBe('GET');
    req.flush(mockTasks);
  });

  it('should create a task', () => {
    const createRequest: CreateTaskRequest = {
      title: 'New Task',
      summary: 'New Task',
      description: 'New Description',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.HIGH,
      assignee: 'Jane Doe',
      estimatedHours: 3,
      tags: 'new,test'
    };

    service.createTask(createRequest).subscribe(task => {
      expect(task).toEqual(jasmine.objectContaining({
        id: mockTask.id,
        title: mockTask.title,
        description: mockTask.description,
        status: mockTask.status,
        priority: mockTask.priority,
        issueId: jasmine.any(String)
      }));
    });

    const req = httpMock.expectOne('http://localhost:8080/api/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createRequest);
    req.flush(mockTask);
  });

  it('should update a task', () => {
    const updateRequest: UpdateTaskRequest = {
      id: 1,
      title: 'Updated Task',
      summary: 'Updated Task',
      description: 'Updated Description',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assignee: 'Jane Doe',
      estimatedHours: 4,
      tags: 'updated,test',
      version: 1
    };

    service.updateTask(updateRequest).subscribe(task => {
      expect(task).toEqual(jasmine.objectContaining({
        id: mockTask.id,
        title: mockTask.title,
        description: mockTask.description,
        status: mockTask.status,
        priority: mockTask.priority,
        issueId: jasmine.any(String)
      }));
    });

    const req = httpMock.expectOne('http://localhost:8080/api/tasks/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateRequest);
    req.flush(mockTask);
  });

  it('should delete a task', () => {
    service.deleteTask(1).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/tasks/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should handle error responses', () => {
    service.loadTasks().subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error).toBeTruthy();
      }
    });

    const req = httpMock.expectOne('http://localhost:8080/api/tasks');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});