/**
 * Task Status Enum - Project states (matches backend exactly)
 */
export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  IN_PROGRESS = 'IN_PROGRESS', 
  REVIEW = 'REVIEW',
  TESTING = 'TESTING',
  DONE = 'DONE'
}

/**
 * Task Priority Enum - Project priorities (matches backend exactly)
 */
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Legacy aliases for backward compatibility
export const IssueStatus = TaskStatus;
export const IssuePriority = TaskPriority;
export type IssueStatus = TaskStatus;
export type IssuePriority = TaskPriority;

/**
 * Task Interface - Project task structure (matches backend TaskDTO)
 */
export interface Issue {
  readonly id?: number;
  readonly issueId?: string; // Task ID like TASK-123
  readonly summary: string; // Task summary
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly assignee?: string;
  readonly estimatedHours?: number;
  readonly tags?: string;
  readonly version?: number; // Critical for optimistic locking
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly createdBy?: string;
  readonly updatedBy?: string;
}

/**
 * Task Interface - backward compatibility with legacy naming
 */
export interface Task extends Issue {
  readonly title: string; // Maps to summary for backward compatibility
}

/**
 * Task Creation Request
 */
export interface CreateIssueRequest {
  readonly summary: string; // Task title
  readonly description: string;
  readonly status: IssueStatus;
  readonly priority: IssuePriority;
  readonly assignee?: string;
  readonly estimatedHours?: number;
  readonly tags?: string;
  readonly createdBy?: string;
}

/**
 * Issue Update Request - includes version for optimistic locking
 */
export interface UpdateIssueRequest {
  readonly id: number;
  readonly summary: string; // Task title
  readonly description: string;
  readonly status: IssueStatus;
  readonly priority: IssuePriority;
  readonly assignee?: string;
  readonly estimatedHours?: number;
  readonly tags?: string;
  readonly version: number; // Must include for conflict detection
  readonly updatedBy?: string;
}

/**
 * Legacy Task interfaces for backward compatibility
 */
export interface CreateTaskRequest extends CreateIssueRequest {
  readonly title: string; // Maps to summary
}

export interface UpdateTaskRequest extends UpdateIssueRequest {
  readonly title: string; // Maps to summary
}

/**
 * API Error Response for Conflicts
 */
export interface ConflictErrorResponse {
  readonly error: 'OPTIMISTIC_LOCK_CONFLICT';
  readonly message: string;
  readonly currentData: Task;
  readonly timestamp: number;
}

/**
 * Task Statistics from backend
 */
export interface TaskStatistics {
  readonly totalTasks: number;
  readonly byStatus: Record<string, number>;
  readonly byPriority: Record<string, number>;
  readonly byAssignee: Record<string, number>;
  readonly completionRate: number;
  readonly totalEstimatedHours: number;
  readonly timestamp: string;
}

/**
 * Task Search Criteria
 */
export interface TaskSearchCriteria {
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assignee?: string;
  readonly searchTerm?: string;
  // Multi-select support
  readonly selectedStatuses?: readonly TaskStatus[];
  readonly selectedPriorities?: readonly TaskPriority[];
  readonly selectedAssignees?: readonly string[];
  readonly selectedTypes?: readonly string[];
}

/**
 * Display Information for UI
 */
export interface TaskStatusDisplay {
  readonly status: TaskStatus;
  readonly displayName: string;
  readonly icon: string;
}

export interface TaskPriorityDisplay {
  readonly priority: TaskPriority;
  readonly displayName: string;
  readonly icon: string;
  readonly level: number;
}

/**
 * Utility class for Task operations
 */
export class IssueUtils {
  
  // Professional color scheme
  private static readonly STATUS_DISPLAY_MAP: Record<IssueStatus, TaskStatusDisplay> = {
    [IssueStatus.BACKLOG]: {
      status: IssueStatus.BACKLOG,
      displayName: 'TO DO',
      icon: 'radio_button_unchecked'
    },
    [IssueStatus.IN_PROGRESS]: {
      status: IssueStatus.IN_PROGRESS,
      displayName: 'IN PROGRESS',
      icon: 'schedule'
    },
    [IssueStatus.REVIEW]: {
      status: IssueStatus.REVIEW,
      displayName: 'REVIEW',
      icon: 'rate_review'
    },
    [IssueStatus.TESTING]: {
      status: IssueStatus.TESTING,
      displayName: 'TEST',
      icon: 'bug_report'
    },
    [IssueStatus.DONE]: {
      status: IssueStatus.DONE,
      displayName: 'DONE',
      icon: 'check_circle'
    }
  } as const;

  // Professional priority  icons
  private static readonly PRIORITY_DISPLAY_MAP: Record<IssuePriority, TaskPriorityDisplay> = {
    [IssuePriority.LOW]: {
      priority: IssuePriority.LOW,
      displayName: 'Minor',
      icon: 'expand_more',
      level: 1
    },
    [IssuePriority.MEDIUM]: {
      priority: IssuePriority.MEDIUM,
      displayName: 'Normal',
      icon: 'remove',
      level: 2
    },
    [IssuePriority.HIGH]: {
      priority: IssuePriority.HIGH,
      displayName: 'Major',
      icon: 'expand_less',
      level: 3
    },
    [IssuePriority.CRITICAL]: {
      priority: IssuePriority.CRITICAL,
      displayName: 'Critical',
      icon: 'error',
      level: 4
    }
  } as const;

  /**
   * Generate task ID (e.g., TASK-123)
   */
  static generateIssueId(id: number): string {
    return `TASK-${id.toString().padStart(3, '0')}`;
  }

  /**
   * Parse task ID to get numeric ID
   */
  static parseIssueId(issueId: string): number | null {
    const match = issueId.match(/^TASK-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  static getStatusDisplay(status: IssueStatus): TaskStatusDisplay {
    return this.STATUS_DISPLAY_MAP[status];
  }

  static getPriorityDisplay(priority: IssuePriority): TaskPriorityDisplay {
    return this.PRIORITY_DISPLAY_MAP[priority];
  }

  static getAllStatuses(): readonly IssueStatus[] {
    return Object.values(IssueStatus);
  }

  static getAllPriorities(): readonly IssuePriority[] {
    return Object.values(IssuePriority);
  }

  static parseTags(tags?: string): readonly string[] {
    if (!tags?.trim()) return [];
    return tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  static formatTags(tags: readonly string[]): string {
    return tags.join(', ');
  }

  static isOverdue(issue: Issue): boolean {
    if (!issue.estimatedHours || !issue.createdAt || issue.status === IssueStatus.DONE) {
      return false;
    }
    
    const createdDate = new Date(issue.createdAt);
    const hoursElapsed = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
    return hoursElapsed > issue.estimatedHours;
  }

  static sortIssuesByPriority(issues: readonly Issue[]): readonly Issue[] {
    return [...issues].sort((a, b) => {
      const aPriority = this.getPriorityDisplay(a.priority).level;
      const bPriority = this.getPriorityDisplay(b.priority).level;
      return bPriority - aPriority; // Higher priority first
    });
  }

  /**
   * Convert Issue to legacy Task format for backward compatibility
   */
  static issueToTask(issue: Issue): Task {
    return {
      ...issue,
      title: issue.summary // Map summary to title for backward compatibility
    };
  }

  /**
   * Convert legacy Task to Issue format
   */
  static taskToIssue(task: Task): Issue {
    const { title, ...issueProps } = task;
    return {
      ...issueProps,
      summary: title || task.summary // Use title as summary for backward compatibility
    };
  }
}

// Legacy TaskUtils class for backward compatibility
export class TaskUtils extends IssueUtils {
  // All methods are inherited from IssueUtils
  
  // Backward compatibility methods
  static override isOverdue(task: Task): boolean {
    return super.isOverdue(this.taskToIssue(task));
  }

  static sortTasksByPriority(tasks: readonly Task[]): readonly Task[] {
    const issues = tasks.map(task => this.taskToIssue(task));
    const sortedIssues = super.sortIssuesByPriority(issues);
    return sortedIssues.map(issue => this.issueToTask(issue));
  }

  static override getStatusDisplay(status: TaskStatus): { status: TaskStatus; displayName: string; icon: string } {
    switch (status) {
      case TaskStatus.BACKLOG:
        return { status, displayName: 'Backlog', icon: 'inbox' };
      case TaskStatus.IN_PROGRESS:
        return { status, displayName: 'In Progress', icon: 'play_arrow' };
      case TaskStatus.REVIEW:
        return { status, displayName: 'Review', icon: 'rate_review' };
      case TaskStatus.TESTING:
        return { status, displayName: 'Testing', icon: 'bug_report' };
      case TaskStatus.DONE:
        return { status, displayName: 'Done', icon: 'check_circle' };
      default:
        return { status, displayName: 'Unknown', icon: 'help' };
    }
  }
} 