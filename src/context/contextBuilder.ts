import { State, ExecutionMode, ContextData, Task } from '../types';
import { loadState, getCurrentTask, getNextPendingTask } from '../state/state';

export interface ExecutionContext {
  task: string;
  taskId: number | null;
  state: State;
  lastError: string | null;
  executionMode: ExecutionMode;
  provider: string;
  retryCount: number;
  iteration: number;
}

export class ContextBuilder {
  private executionMode: ExecutionMode = 'build';
  private provider: string = 'opencode';
  private iteration: number = 0;

  setMode(mode: ExecutionMode): void {
    this.executionMode = mode;
  }

  setProvider(provider: string): void {
    this.provider = provider;
  }

  incrementIteration(): void {
    this.iteration++;
  }

  build(): ExecutionContext {
    const state = loadState();
    const currentTask = getCurrentTask() || getNextPendingTask();

    return {
      task: currentTask?.description || '',
      taskId: currentTask?.id || null,
      state,
      lastError: state.lastError,
      executionMode: this.executionMode,
      provider: this.provider,
      retryCount: state.retries,
      iteration: this.iteration
    };
  }

  buildForTask(task: Task): ExecutionContext {
    const state = loadState();
    return {
      task: task.description,
      taskId: task.id,
      state,
      lastError: state.lastError,
      executionMode: this.executionMode,
      provider: this.provider,
      retryCount: state.retries,
      iteration: this.iteration
    };
  }

  toPrompt(context: ExecutionContext): string {
    let prompt = context.task;
    
    if (context.lastError) {
      prompt += `\n\nPrevious attempt failed with: ${context.lastError}`;
      prompt += `\n\nIMPORTANT: Fix the error above before completing the task.`;
    }
    
    // Interactive mode: allow OpenCode to manage state
    prompt += `\n\n--- INTERACTIVE MODE ---`;
    prompt += `\nYou can read/write the following files to manage task state:`;
    prompt += `\n- state.json: Contains currentTask, tasks array, retries, lastError`;
    prompt += `\n- audit.log: Append-only execution log`;
    prompt += `\n- .chief-wiggum/config.json: Provider configuration`;
    prompt += `\n\nWhen you complete a task, you can:`;
    prompt += `\n1. Mark the task as "done" in state.json`;
    prompt += `\n2. Add new tasks to the tasks array`;
    prompt += `\n3. Update currentTask to the next task ID`;
    prompt += `\n\nWhen complete, output exactly "[DONE]" (including brackets) to signal success.`;
    
    return prompt;
  }

  toMarkdown(context: ExecutionContext): string {
    const lines = [
      '# Execution Context',
      '',
      `**Mode:** ${context.executionMode}`,
      `**Task:** ${context.task} (ID: ${context.taskId})`,
      `**Provider:** ${context.provider}`,
      `**Retries:** ${context.retryCount}`,
      `**Iteration:** ${context.iteration}`,
      ''
    ];

    if (context.lastError) {
      lines.push(`**Last Error:** ${context.lastError}`);
      lines.push('');
    }

    lines.push('## Current Tasks');
    for (const t of context.state.tasks) {
      lines.push(`- [${t.status}] ${t.id}: ${t.description}`);
    }

    return lines.join('\n');
  }
}

export function createContextBuilder(): ContextBuilder {
  return new ContextBuilder();
}