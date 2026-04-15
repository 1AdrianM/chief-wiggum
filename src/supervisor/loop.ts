import { logger } from '../utils/logger';
import { computeErrorHash } from '../utils/errors';
import { loadState, saveState, getCurrentTask, getNextPendingTask, areAllTasksDone, advanceToNextTask, setLastError, clearLastError, incrementRetries, resetRetries, Task } from './state';
import { validateState, canRetry, shouldStop, isRepeatedFailure, MAX_RETRIES } from './validator';
import { executeTask, runVerification, parseOutput, ExecutionResult } from './executor';
import { FallbackManager, FallbackConfig, createFallbackManager } from './fallback';
import { gitCommit, gitRevertLast, hasPendingChanges } from '../utils/git';

export interface LoopConfig {
  verifyCommand: string;
  maxIterations?: number;
  workdir?: string;
  cooldownMinutes?: number;
}

export class SupervisorLoop {
  private config: LoopConfig;
  private fallbackManager: FallbackManager;
  private totalIterations: number = 0;
  private running: boolean = false;

  constructor(config: Partial<LoopConfig> = {}) {
    this.config = {
      verifyCommand: config.verifyCommand || 'npm run build',
      maxIterations: config.maxIterations || 100,
      workdir: config.workdir,
      cooldownMinutes: config.cooldownMinutes || 10
    };

    const fallbackConfig: Partial<FallbackConfig> = {
      cooldownMinutes: config.cooldownMinutes || 10,
      maxRetries: MAX_RETRIES
    };
    this.fallbackManager = createFallbackManager(fallbackConfig);
  }

  async start(): Promise<void> {
    this.running = true;
    logger.info('Supervisor loop started');

    while (this.running) {
      if (shouldStop(loadState(), this.totalIterations)) {
        logger.warn('Stop condition reached');
        break;
      }

      await this.iteration();
      this.totalIterations++;

      if (areAllTasksDone()) {
        logger.info('All tasks completed');
        break;
      }
    }

    logger.info(`Supervisor loop finished after ${this.totalIterations} iterations`);
  }

  stop(): void {
    this.running = false;
    logger.info('Supervisor loop stopped');
  }

  private async iteration(): Promise<void> {
    logger.info(`Starting iteration ${this.totalIterations + 1}`);

    const state = loadState();
    const validation = validateState(state);

    if (!validation.valid) {
      logger.error(`Invalid state: ${validation.errors.join(', ')}`);
      this.running = false;
      return;
    }

    const currentTask = getCurrentTask();
    if (!currentTask) {
      const nextTask = getNextPendingTask();
      if (!nextTask) {
        logger.info('No pending tasks found');
        this.running = false;
        return;
      }
      logger.info(`Starting task ${nextTask.id}: ${nextTask.description}`);
    }

    try {
      const result = await this.executeCurrentTask();
      await this.handleExecutionResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Iteration error: ${message}`);
    }
  }

  private async executeCurrentTask(): Promise<ExecutionResult> {
    const state = loadState();
    const task = getCurrentTask() || getNextPendingTask();

    if (!task) {
      return {
        stdout: '[DONE]',
        stderr: '',
        exitCode: 0,
        errorHash: ''
      };
    }

    const provider = await this.fallbackManager.getProvider();
    return executeTask(provider, task.description, { workdir: this.config.workdir });
  }

  private async handleExecutionResult(result: ExecutionResult): Promise<void> {
    const state = loadState();
    const parsed = parseOutput(result.stdout);

    if (result.exitCode !== 0) {
      await this.handleFailure(result.stderr || result.stdout);
      return;
    }

    if (parsed.done) {
      logger.info('Task completed: [DONE] detected');

      if (hasPendingChanges()) {
        gitCommit(`Task ${state.currentTask} completed`);
      }

      const verified = await runVerification(this.config.verifyCommand, this.config.workdir);
      if (verified) {
        advanceToNextTask();
        clearLastError();
        resetRetries();
      } else {
        logger.error('Verification failed, will retry');
        setLastError('Verification failed', computeErrorHash('verification failed'));
      }
      return;
    }

    if (parsed.hasError) {
      await this.handleFailure(result.stdout);
      return;
    }

    advanceToNextTask();
    clearLastError();
    resetRetries();
  }

  private async handleFailure(errorMessage: string): Promise<void> {
    const state = loadState();
    const errorHash = computeErrorHash(errorMessage);

    if (isRepeatedFailure(state, errorHash)) {
      logger.error('Repeated failure detected, rolling back');

      if (hasPendingChanges()) {
        gitRevertLast();
        incrementRetries();
      }

      setLastError(errorMessage, errorHash);

      if (canRetry(state)) {
        return;
      }

      logger.error('Max retries exceeded, blocking task');
      this.running = false;
      return;
    }

    incrementRetries();
    setLastError(errorMessage, errorHash);
  }
}

export function createSupervisorLoop(config?: Partial<LoopConfig>): SupervisorLoop {
  return new SupervisorLoop(config);
}