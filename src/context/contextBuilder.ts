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
    // Build task context - show all tasks and their status
    const taskList = context.state.tasks
      .map(t => `  ${t.id}. [${t.status}] ${t.description}`)
      .join('\n');
    
    const completedTasks = context.state.tasks
      .filter(t => t.status === 'done')
      .map(t => `- Task ${t.id}: ${t.description}`)
      .join('\n');
    
    const pendingTasks = context.state.tasks
      .filter(t => t.status === 'pending')
      .map(t => `- Task ${t.id}: ${t.description}`)
      .join('\n');

    let prompt = `--- TASK CONTEXT ---\n`;
    prompt += `Current Task: ${context.taskId}\n\n`;
    prompt += `ALL TASKS:\n${taskList}\n\n`;
    
    if (completedTasks) {
      prompt += `COMPLETED TASKS:\n${completedTasks}\n\n`;
    }
    
    if (pendingTasks) {
      prompt += `PENDING TASKS (next to execute):\n${pendingTasks}\n\n`;
    }
    
    prompt += `--- CURRENT TASK ---\n`;
    prompt += `${context.task}\n\n`;
    
    // IMPORTANT: Agent must understand the full context before executing
    prompt += `--- CONTEXT RULES ---\n`;
    prompt += `1. BEFORE starting, read state.json to understand the full task list\n`;
    prompt += `2. If this task depends on previous tasks, verify they are completed\n`;
    prompt += `3. If you discover this task cannot be done without completing another first:\n`;
    prompt += `   - Add the dependency as a new pending task in state.json\n`;
    prompt += `   - Mark current task as "pending" and update currentTask to the new task\n`;
    prompt += `4. After completing, update state.json with the result\n\n`;
    
    if (context.lastError) {
      prompt += `--- PREVIOUS ERROR ---\n`;
      prompt += `${context.lastError}\n`;
      prompt += `IMPORTANT: Fix the error above before completing the task.\n\n`;
    }
    
    // Interactive mode: allow OpenCode to manage state
    prompt += `--- INTERACTIVE MODE ---\n`;
    prompt += `You can read/write the following files to manage task state:\n`;
    prompt += `- state.json: Contains currentTask, tasks array, retries, lastError\n`;
    prompt += `- audit.log: Append-only execution log\n`;
    prompt += `- .chief-wiggum/config.json: Provider configuration\n`;
    prompt += `- PRD.md or SPEC.md: Project specifications\n\n`;
    prompt += `When you complete a task, you can:\n`;
    prompt += `1. Mark the task as "done" in state.json\n`;
    prompt += `2. Add new tasks to the tasks array if you discover dependencies\n`;
    prompt += `3. Update currentTask to the next task ID\n`;
    prompt += `\nWhen complete, output exactly "[DONE]" (including brackets) to signal success.`;
    
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