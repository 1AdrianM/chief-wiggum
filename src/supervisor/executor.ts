import { spawn } from 'child_process';
import { logger, LogLevel } from '../utils/logger';
import { ExecutionError, computeErrorHash } from '../utils/errors';
import { Provider } from './fallback';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  errorHash: string;
}

export interface ExecutorConfig {
  workdir?: string;
  timeout?: number;
}

export async function executeTask(
  provider: Provider,
  taskDescription: string,
  config: ExecutorConfig = {}
): Promise<ExecutionResult> {
  const prompt = `Check progress.json and complete the next task in PRD.md. If all tasks are complete, output [DONE]. Task: ${taskDescription}`;

  logger.info('Executing task', { 
    taskId: 0, 
    retries: 0 
  });

  try {
    const result = await provider.execute(prompt);
    
    if (result.exitCode !== 0) {
      logger.error(`Task execution failed`, { 
        error: result.stderr || result.stdout 
      });
    } else {
      logger.info('Task execution completed');
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Task execution error`, { error: message });
    
    return {
      stdout: '',
      stderr: message,
      exitCode: -1,
      errorHash: computeErrorHash(message)
    };
  }
}

export async function runVerification(verifyCommand: string, workdir?: string): Promise<boolean> {
  logger.info(`Running verification: ${verifyCommand}`);

  return new Promise((resolve) => {
    const [cmd, ...args] = verifyCommand.split(' ');
    const child = spawn(cmd, args, {
      cwd: workdir || process.cwd(),
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const success = code === 0;
      if (success) {
        logger.info('Verification passed');
      } else {
        logger.error(`Verification failed`, { error: stderr || stdout });
      }
      resolve(success);
    });

    child.on('error', (err) => {
      logger.error(`Verification error`, { error: err.message });
      resolve(false);
    });
  });
}

export function parseOutput(output: string): { done: boolean; hasError: boolean } {
  const done = output.includes('[DONE]');
  const hasError = output.toLowerCase().includes('error:') || 
                  output.toLowerCase().includes('failed:');
  
  return { done, hasError };
}