export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  errorHash: string;
}

export interface Task {
  id: number;
  status: TaskStatus;
  description: string;
  createdAt?: string;
  completedAt?: string;
}

export type TaskStatus = 'pending' | 'done' | 'blocked' | 'failed';

export interface State {
  currentTask: number;
  tasks: Task[];
  retries: number;
  lastError: string | null;
  lastErrorHash: string | null;
}

export type ExecutionMode = 'plan' | 'build' | 'debug';

export interface LoopConfig {
  verifyCommand: string;
  maxIterations?: number;
  workdir?: string;
  cooldownMinutes?: number;
  executionMode?: ExecutionMode;
}

export interface AuditEntry {
  timestamp: string;
  event: AuditEvent;
  taskId?: number;
  provider?: string;
  details?: string;
  errorHash?: string;
}

export type AuditEvent = 
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'loop_started'
  | 'loop_stopped'
  | 'loop_stuck'
  | 'inspector_run'
  | 'retry_triggered'
  | 'fallback_triggered';

export interface NotificationEvent {
  type: NotificationEventType;
  timestamp: string;
  payload: Record<string, unknown>;
}

export type NotificationEventType = 
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'loop_stuck';

export interface ContextData {
  currentTask: Task | null;
  state: State;
  lastError: string | null;
  executionMode: ExecutionMode;
  provider: string;
  retryCount: number;
  iteration: number;
}