import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { State, Task, TaskStatus } from '../types';

const STATE_FILE = 'state.json';
const BACKUP_FILE = 'state.bak.json';

export function loadState(): State {
  try {
    const data = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(data) as State;
  } catch (err) {
    logger.error(`Failed to load state`, { error: String(err) });
    throw new Error(`Failed to load state: ${err}`);
  }
}

export function saveState(state: State): void {
  try {
    const backupData = fs.readFileSync(STATE_FILE, 'utf8');
    fs.writeFileSync(BACKUP_FILE, backupData);
  } catch {
    logger.warn('No existing state to backup');
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  logger.debug(`State saved: currentTask=${state.currentTask}`);
}

export function getCurrentTask(): Task | null {
  const state = loadState();
  return state.tasks.find(t => t.id === state.currentTask) || null;
}

export function getPendingTasks(): Task[] {
  const state = loadState();
  return state.tasks.filter(t => t.status === 'pending');
}

export function getNextPendingTask(): Task | null {
  const state = loadState();
  for (const task of state.tasks) {
    if (task.status === 'pending') {
      return task;
    }
  }
  return null;
}

export function areAllTasksDone(): boolean {
  const state = loadState();
  return state.tasks.every(t => t.status === 'done');
}

export function incrementRetries(): number {
  const state = loadState();
  state.retries += 1;
  saveState(state);
  return state.retries;
}

export function resetRetries(): void {
  const state = loadState();
  state.retries = 0;
  saveState(state);
}

export function setLastError(error: string, errorHash: string): void {
  const state = loadState();
  state.lastError = error;
  state.lastErrorHash = errorHash;
  saveState(state);
}

export function clearLastError(): void {
  const state = loadState();
  state.lastError = null;
  state.lastErrorHash = null;
  saveState(state);
}

export function updateTaskStatus(taskId: number, status: TaskStatus): void {
  const state = loadState();
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }
  task.status = status;
  saveState(state);
}

export function advanceToNextTask(): void {
  const state = loadState();
  const currentTask = state.tasks.find(t => t.id === state.currentTask);
  if (currentTask) {
    currentTask.status = 'done';
  }

  let found = false;
  for (const task of state.tasks) {
    if (task.status === 'pending') {
      state.currentTask = task.id;
      found = true;
      break;
    }
  }

  if (!found) {
    state.currentTask = state.tasks.length + 1;
  }

  saveState(state);
}