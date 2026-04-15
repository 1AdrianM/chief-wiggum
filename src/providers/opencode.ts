import { spawn } from 'child_process';
import { logger, LogLevel } from '../utils/logger';
import { ExecutionError, computeErrorHash } from '../utils/errors';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  errorHash: string;
}

export interface OpenCodeProvider {
  name: string;
  execute(prompt: string): Promise<ExecutionResult>;
  isAvailable(): Promise<boolean>;
}

export class OpenCodeCLIProvider implements OpenCodeProvider {
  public name = 'opencode';

  async execute(prompt: string): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const args = ['--yes', prompt];
      const child = spawn('opencode', args, {
        stdio: ['pipe', 'pipe', 'pipe']
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
        const exitCode = code ?? -1;
        const errorHash = computeErrorHash(stderr || stdout);

        logger.debug(`OpenCode execution completed`, { 
          retries: 0 
        });

        resolve({
          stdout,
          stderr,
          exitCode,
          errorHash
        });
      });

      child.on('error', (err) => {
        const errorHash = computeErrorHash(err.message);
        resolve({
          stdout: '',
          stderr: err.message,
          exitCode: -1,
          errorHash
        });
      });
    });
  }

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('opencode', ['--version']);
      child.on('close', (code) => {
        resolve(code === 0);
      });
      child.on('error', () => {
        resolve(false);
      });
    });
  }
}

export function createOpenCodeProvider(): OpenCodeProvider {
  return new OpenCodeCLIProvider();
}