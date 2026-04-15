import { State, loadState } from './state';
import { logger } from '../utils/logger';
import { ValidationError, computeErrorHash } from '../utils/errors';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const MAX_RETRIES = 3;
export const MAX_TOTAL_ITERATIONS = 100;

export function validateState(state: State): ValidationResult {
  const errors: string[] = [];

  if (!state.currentTask || state.currentTask < 1) {
    errors.push('Invalid currentTask: must be >= 1');
  }

  if (!state.tasks || !Array.isArray(state.tasks) || state.tasks.length === 0) {
    errors.push('Invalid tasks: must be a non-empty array');
  } else {
    for (let i = 0; i < state.tasks.length; i++) {
      const task = state.tasks[i];
      if (!task.id || !task.status || !task.description) {
        errors.push(`Task at index ${i} is missing required fields`);
      }
    }
  }

  if (state.retries < 0 || state.retries > MAX_RETRIES * 10) {
    errors.push(`Invalid retries: must be between 0 and ${MAX_RETRIES * 10}`);
  }

  const valid = errors.length === 0;
  return { valid, errors };
}

export function validateStateJSON(json: string): ValidationResult {
  try {
    const state = JSON.parse(json) as State;
    return validateState(state);
  } catch (err) {
    return {
      valid: false,
      errors: [`Failed to parse JSON: ${err}`]
    };
  }
}

export function canRetry(state: State): boolean {
  return state.retries < MAX_RETRIES;
}

export function shouldStop(state: State, totalIterations: number): boolean {
  if (totalIterations >= MAX_TOTAL_ITERATIONS) {
    logger.warn(`Max total iterations (${MAX_TOTAL_ITERATIONS}) reached`);
    return true;
  }

  return false;
}

export function isRepeatedFailure(state: State, errorHash: string): boolean {
  return state.lastErrorHash === errorHash && state.lastError !== null;
}