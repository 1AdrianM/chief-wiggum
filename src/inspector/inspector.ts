import { State, ExecutionMode } from '../types';
import { loadState } from '../state/state';
import { appendAudit, createAuditEntry } from '../state/audit';
import { logger } from '../utils/logger';
import { computeErrorHash } from '../utils/errors';

export interface InspectionResult {
  pattern: FailurePattern;
  recommendation: RetryStrategy;
  details: string;
}

export type FailurePattern = 
  | 'none'
  | 'repeated_error'
  | 'validation_failure'
  | 'provider_unavailable'
  | 'timeout'
  | 'unknown';

export type RetryStrategy = 
  | 'retry'
  | 'skip_task'
  | 'fallback_provider'
  | 'stop';

export class FailureInspector {
  private maxRetries: number = 3;
  private executionMode: ExecutionMode = 'build';

  constructor(maxRetries: number = 3) {
    this.maxRetries = maxRetries;
  }

  setMode(mode: ExecutionMode): void {
    this.executionMode = mode;
  }

  shouldRun(lastError: string | null, retries: number): boolean {
    if (this.executionMode === 'debug') {
      return true;
    }
    return lastError !== null && retries > 0;
  }

  inspect(): InspectionResult {
    const state = loadState();
    
    if (!state.lastError) {
      return {
        pattern: 'none',
        recommendation: 'retry',
        details: 'No errors detected'
      };
    }

    appendAudit(createAuditEntry('inspector_run', {
      taskId: state.currentTask,
      details: state.lastError!
    }));

    const pattern = this.detectPattern(state.lastError, state.lastErrorHash);
    const recommendation = this.determineStrategy(pattern, state.retries);

    logger.info(`Inspection: ${pattern} -> ${recommendation}`, { taskId: state.currentTask, retries: state.retries });

    return {
      pattern,
      recommendation,
      details: `Detected: ${pattern}, recommendation: ${recommendation}`
    };
  }

  private detectPattern(error: string, errorHash: string | null): FailurePattern {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('timeout')) {
      return 'timeout';
    }

    if (errorLower.includes('not found') || errorLower.includes('unavailable')) {
      return 'provider_unavailable';
    }

    if (errorLower.includes('verification') || errorLower.includes('validation')) {
      return 'validation_failure';
    }

    return 'repeated_error';
  }

  private determineStrategy(pattern: FailurePattern, retries: number): RetryStrategy {
    switch (pattern) {
      case 'timeout':
        return retries < this.maxRetries ? 'retry' : 'skip_task';
      
      case 'provider_unavailable':
        return retries < this.maxRetries ? 'fallback_provider' : 'stop';
      
      case 'validation_failure':
        return 'skip_task';
      
      case 'repeated_error':
        return retries < this.maxRetries ? 'retry' : 'skip_task';
      
      default:
        return retries < this.maxRetries ? 'retry' : 'stop';
    }
  }

  enrichContext(context: Record<string, unknown>, result: InspectionResult): Record<string, unknown> {
    return {
      ...context,
      inspection: {
        pattern: result.pattern,
        recommendation: result.recommendation,
        details: result.details
      }
    };
  }
}

export function createInspector(maxRetries: number = 3): FailureInspector {
  return new FailureInspector(maxRetries);
}