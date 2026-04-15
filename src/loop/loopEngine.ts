import { logger } from '../utils/logger';
import { computeErrorHash } from '../utils/errors';
import { 
  loadState, 
  saveState, 
  getCurrentTask, 
  getNextPendingTask, 
  areAllTasksDone, 
  advanceToNextTask, 
  setLastError, 
  clearLastError, 
  incrementRetries, 
  resetRetries
} from '../state/state';
import { appendAudit, createAuditEntry } from '../state/audit';
import { LoopConfig, ExecutionMode, ExecutionResult } from '../types';
import { ContextBuilder, createContextBuilder } from '../context/contextBuilder';
import { FailureInspector, createInspector, RetryStrategy } from '../inspector/inspector';
import { dispatcher } from '../notifications/dispatcher';
import { createEvent } from '../notifications/events';
import { ProviderRegistry } from '../providers/registry';

export class LoopEngine {
  private config: LoopConfig;
  private contextBuilder: ContextBuilder;
  private inspector: FailureInspector;
  private registry: ProviderRegistry;
  private totalIterations: number = 0;
  private running: boolean = false;
  private success: boolean = false;
  private currentProviderName: string = 'opencode';

  constructor(config: Partial<LoopConfig> = {}) {
    this.config = {
      verifyCommand: config.verifyCommand || 'npm run build',
      maxIterations: config.maxIterations || 100,
      workdir: config.workdir,
      cooldownMinutes: config.cooldownMinutes || 10,
      executionMode: config.executionMode || 'build'
    };

    this.contextBuilder = createContextBuilder();
    this.contextBuilder.setMode(this.config.executionMode || 'build');
    
    this.inspector = createInspector();
    this.inspector.setMode(this.config.executionMode || 'build');
    
    this.registry = new ProviderRegistry();
  }

  async start(): Promise<boolean> {
    this.running = true;
    this.success = false;
    
    appendAudit(createAuditEntry('loop_started'));
    dispatcher.emit('task_started', {});
    logger.info(`Loop engine started (mode: ${this.config.executionMode})`);

    while (this.running) {
      if (this.shouldStop()) {
        logger.warn('Stop condition reached');
        break;
      }

      await this.iteration();
      this.totalIterations++;

      if (areAllTasksDone()) {
        logger.info('All tasks completed');
        this.success = true;
        break;
      }
    }

    appendAudit(createAuditEntry('loop_stopped'));
    
    if (this.success) {
      logger.info(`Loop finished successfully after ${this.totalIterations} iterations`);
    } else {
      logger.error(`Loop finished with failures after ${this.totalIterations} iterations`);
    }
    
    return this.success;
  }

  stop(): void {
    this.running = false;
    logger.info('Loop engine stopped');
  }

  isSuccess(): boolean {
    return this.success;
  }

  private shouldStop(): boolean {
    if (this.totalIterations >= (this.config.maxIterations || 100)) {
      appendAudit(createAuditEntry('loop_stuck', { details: 'Max iterations reached' }));
      dispatcher.emit('loop_stuck', { iterations: this.totalIterations });
      return true;
    }
    return false;
  }

  private async iteration(): Promise<void> {
    const state = loadState();
    const task = getCurrentTask() || getNextPendingTask();
    
    logger.info(`Starting iteration ${this.totalIterations + 1}`, { 
      taskId: task?.id,
      retries: state.retries 
    });

    this.contextBuilder.incrementIteration();

    try {
      const result = await this.executeTask();
      await this.handleResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Iteration error: ${message}`);
      setLastError(message, computeErrorHash(message));
    }
    
    // Reload state after each iteration to detect external changes (interactive mode)
    const newState = loadState();
    logger.debug(`State after iteration: currentTask=${newState.currentTask}, tasks=${newState.tasks.length}`);
  }

  private async executeTask(): Promise<ExecutionResult> {
    const task = getCurrentTask() || getNextPendingTask();
    
    if (!task) {
      return {
        stdout: '[DONE]',
        stderr: '',
        exitCode: 0,
        errorHash: ''
      };
    }

    appendAudit(createAuditEntry('task_started', {
      taskId: task.id,
      provider: this.currentProviderName
    }));
    
    dispatcher.emit('task_started', { 
      taskId: task.id, 
      description: task.description 
    });

    const provider = this.registry.getPrimary();
    if (!provider) {
      throw new Error('No provider available');
    }

    this.currentProviderName = provider.name;
    this.contextBuilder.setProvider(provider.name);
    
    const context = this.contextBuilder.build();
    const prompt = this.contextBuilder.toPrompt(context);
    
    return provider.execute(prompt);
  }

  private async handleResult(result: ExecutionResult): Promise<void> {
    const state = loadState();
    const task = getCurrentTask();
    
    const output = result.stdout;
    
    // Check for [DONE] first - this is the primary success indicator
    // [DONE] can appear even with non-zero exit codes (e.g., timeouts)
    if (output.includes('[DONE]')) {
      logger.info('Task completed: [DONE] detected');
      
      appendAudit(createAuditEntry('task_completed', {
        taskId: task?.id,
        provider: this.currentProviderName
      }));
      
      dispatcher.emit('task_completed', { taskId: task?.id });
      
      // In interactive mode, OpenCode might have modified state already
      // Check if task was already marked as done
      const currentTaskAfter = getCurrentTask();
      if (!currentTaskAfter || currentTaskAfter.status !== 'done') {
        advanceToNextTask();
        clearLastError();
        resetRetries();
      } else {
        logger.info('Task was already marked done by agent (interactive mode)');
        clearLastError();
        resetRetries();
      }
      return;
    }
    
    // Only check exit code if [DONE] not found
    if (result.exitCode !== 0) {
      appendAudit(createAuditEntry('task_failed', {
        taskId: task?.id,
        provider: this.currentProviderName,
        errorHash: result.errorHash,
        details: result.stderr || result.stdout
      }));
      
      dispatcher.emit('task_failed', { 
        taskId: task?.id,
        error: result.stderr 
      });
      
      await this.handleFailure(result);
      return;
    }

    const hasError = output.toLowerCase().includes('error:') || 
                     output.toLowerCase().includes('failed:');
    
    if (hasError) {
      appendAudit(createAuditEntry('task_failed', {
        taskId: task?.id,
        provider: this.currentProviderName,
        details: output
      }));
      
      dispatcher.emit('task_failed', { taskId: task?.id, error: output });
      
      await this.handleFailure(result);
      return;
    }

    advanceToNextTask();
    clearLastError();
    resetRetries();
  }

  private async handleFailure(result: ExecutionResult): Promise<void> {
    const state = loadState();
    const errorMessage = result.stderr || result.stdout;
    const errorHash = computeErrorHash(errorMessage);
    
    incrementRetries();
    setLastError(errorMessage, errorHash);
    
    if (this.inspector.shouldRun(state.lastError, state.retries)) {
      const inspection = this.inspector.inspect();
      await this.applyStrategy(inspection.recommendation, errorMessage);
    }
  }

  private async applyStrategy(strategy: RetryStrategy, errorMessage: string): Promise<void> {
    const state = loadState();
    
    switch (strategy) {
      case 'retry':
        logger.info(`Retry strategy: retry (attempt ${state.retries})`);
        break;
        
      case 'skip_task':
        logger.info('Retry strategy: skip task');
        advanceToNextTask();
        break;
        
      case 'fallback_provider':
        logger.info('Retry strategy: fallback provider');
        appendAudit(createAuditEntry('fallback_triggered', {
          details: errorMessage
        }));
        const fallback = this.registry.switchToFallback();
        if (fallback) {
          logger.info(`Switched to fallback provider: ${fallback.name}`);
        }
        break;
        
      case 'stop':
        logger.error('Retry strategy: stop');
        this.running = false;
        break;
    }
  }
}

export function createLoopEngine(config?: Partial<LoopConfig>): LoopEngine {
  return new LoopEngine(config);
}