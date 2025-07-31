import { 
  TaskStatus, 
  TaskPriority, 
  Task, 
  Issue,
  TaskUtils,
  IssueUtils,
  CreateTaskRequest,
  UpdateTaskRequest,
  ConflictErrorResponse,
  TaskStatistics 
} from './task.model';

describe('Task Model', () => {

  describe('TaskStatus Enum', () => {
    it('should have correct status values', () => {
      expect(TaskStatus.BACKLOG).toBe('BACKLOG');
      expect(TaskStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(TaskStatus.REVIEW).toBe('REVIEW');
      expect(TaskStatus.TESTING).toBe('TESTING');
      expect(TaskStatus.DONE).toBe('DONE');
    });
  });

  describe('TaskPriority Enum', () => {
    it('should have correct priority values', () => {
      expect(TaskPriority.LOW).toBe('LOW');
      expect(TaskPriority.MEDIUM).toBe('MEDIUM');
      expect(TaskPriority.HIGH).toBe('HIGH');
      expect(TaskPriority.CRITICAL).toBe('CRITICAL');
    });
  });

  describe('Task Interface', () => {
    it('should create a valid task object', () => {
      const task: Task = {
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

      expect(task).toBeDefined();
      expect(task.id).toBe(1);
      expect(task.status).toBe(TaskStatus.BACKLOG);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
    });
  });

  describe('CreateTaskRequest Interface', () => {
    it('should create a valid create request', () => {
      const request: CreateTaskRequest = {
        title: 'New Task',
        summary: 'New Task',
        description: 'New Description',
        status: TaskStatus.BACKLOG,
        priority: TaskPriority.MEDIUM,
        assignee: 'John Doe',
        estimatedHours: 3,
        tags: 'new,test'
      };

      expect(request).toBeDefined();
      expect(request.title).toBe('New Task');
      expect(request.status).toBe('BACKLOG');
    });
  });

  describe('UpdateTaskRequest Interface', () => {
    it('should create a valid update request', () => {
      const request: UpdateTaskRequest = {
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

      expect(request).toBeDefined();
      expect(request.id).toBe(1);
      expect(request.version).toBe(1);
    });
  });

  describe('TaskStatistics Interface', () => {
    it('should create valid statistics object', () => {
      const stats: TaskStatistics = {
        totalTasks: 10,
        byStatus: { BACKLOG: 5, DONE: 5 },
        byPriority: { HIGH: 3, MEDIUM: 7 },
        byAssignee: { 'John Doe': 6, 'Jane Doe': 4 },
        completionRate: 50.0,
        totalEstimatedHours: 40,
        timestamp: '2024-01-01T10:00:00Z'
      };

      expect(stats).toBeDefined();
      expect(stats.totalTasks).toBe(10);
      expect(stats.completionRate).toBe(50.0);
    });
  });

  describe('TaskUtils Class', () => {
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

    it('should exist and be a class', () => {
      expect(TaskUtils).toBeDefined();
      expect(typeof TaskUtils).toBe('function');
    });

    it('should sort tasks by priority', () => {
      const tasks: Task[] = [
        { ...mockTask, id: 1, priority: TaskPriority.LOW },
        { ...mockTask, id: 2, priority: TaskPriority.CRITICAL },
        { ...mockTask, id: 3, priority: TaskPriority.MEDIUM },
        { ...mockTask, id: 4, priority: TaskPriority.HIGH }
      ];

      const sorted = TaskUtils.sortTasksByPriority(tasks);
      
      expect(sorted).toBeDefined();
      expect(sorted.length).toBe(4);
      // Should sort by priority (CRITICAL > HIGH > MEDIUM > LOW)
      expect(sorted[0].priority).toBe(TaskPriority.CRITICAL);
    });

    it('should get status display information', () => {
      const backlogDisplay = TaskUtils.getStatusDisplay(TaskStatus.BACKLOG);
      expect(backlogDisplay.status).toBe(TaskStatus.BACKLOG);
      expect(backlogDisplay.displayName).toBe('Backlog');
      expect(backlogDisplay.icon).toBe('inbox');

      const inProgressDisplay = TaskUtils.getStatusDisplay(TaskStatus.IN_PROGRESS);
      expect(inProgressDisplay.status).toBe(TaskStatus.IN_PROGRESS);
      expect(inProgressDisplay.displayName).toBe('In Progress');
      expect(inProgressDisplay.icon).toBe('play_arrow');

      const doneDisplay = TaskUtils.getStatusDisplay(TaskStatus.DONE);
      expect(doneDisplay.status).toBe(TaskStatus.DONE);
      expect(doneDisplay.displayName).toBe('Done');
      expect(doneDisplay.icon).toBe('check_circle');
    });
  });

  describe('IssueUtils Class', () => {
    it('should exist and be accessible', () => {
      expect(IssueUtils).toBeDefined();
      expect(typeof IssueUtils).toBe('function');
    });
  });
});