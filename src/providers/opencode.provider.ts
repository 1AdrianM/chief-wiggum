import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import { Provider, ProviderType, ProviderContext } from './provider.interface';
import { ExecutionResult } from '../types';
import { computeErrorHash } from '../utils/errors';

export class OpenCodeProvider implements Provider {
  public readonly name = 'opencode';
  public readonly type: ProviderType = 'opencode';
  private serverProcess: ChildProcess | null = null;
  private serverUrl: string = 'http://localhost:8080';
  private isServerMode: boolean = false;

  constructor(serverUrl?: string, isServerMode: boolean = false) {
    if (serverUrl) this.serverUrl = serverUrl;
    this.isServerMode = isServerMode;
  }

  async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('opencode', ['serve'], {
        stdio: 'inherit',
        shell: true
      });

      this.serverProcess.on('error', (err) => {
        reject(err);
      });

      setTimeout(() => {
        console.log('Server should be starting...');
        resolve();
      }, 5000);
    });
  }

  stopServer(): void {
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      this.serverProcess = null;
    }
  }

  async execute(prompt: string, context?: ProviderContext): Promise<ExecutionResult> {
    if (this.isServerMode) {
      return this.executeViaServer(prompt, context);
    } else {
      return this.executeDirect(prompt, context);
    }
  }

  private async executeViaServer(prompt: string, context?: ProviderContext): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const payload = JSON.stringify({ prompt, workdir: context?.workdir });

      const req = http.request(`${this.serverUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result as ExecutionResult);
          } catch {
            resolve({
              stdout: body,
              stderr: '',
              exitCode: 0,
              errorHash: computeErrorHash(body)
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          stdout: '',
          stderr: err.message,
          exitCode: -1,
          errorHash: computeErrorHash(err.message)
        });
      });

      req.write(payload);
      req.end();

      setTimeout(() => {
        resolve({
          stdout: '',
          stderr: 'Request timeout',
          exitCode: -1,
          errorHash: computeErrorHash('timeout')
        });
      }, context?.timeout || 120000);
    });
  }

  private async executeDirect(prompt: string, context?: ProviderContext): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const workdir = context?.workdir || process.cwd();
      
      console.log(`\n>>> OpenCode Prompt: ${prompt.substring(0, 100)}...\n`);
      
      // Use opencode run with . as project path (current directory)
      const child = spawn('opencode', ['run', '.', '-m', 'opencode/minimax-m2.5-free', '--', prompt], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        cwd: workdir
      });

      let stdout = '';
      let stderr = '';

      // Set timeout (120 seconds default - much longer for file operations)
      const timeoutMs = context?.timeout || 120000;
      const timeout = setTimeout(() => {
        console.log(`\n<<< OpenCode timed out after ${timeoutMs}ms\n`);
        child.kill('SIGTERM');
        resolve({
          stdout: '',
          stderr: 'Execution timeout',
          exitCode: -1,
          errorHash: computeErrorHash('timeout')
        });
      }, timeoutMs);

      child.stdout?.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text);
      });

      child.stderr?.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        const exitCode = code ?? 0;
        
        // Check if we got [DONE] in stdout for success detection
        const doneMatch = stdout.includes('[DONE]');
        
        console.log(`\n<<< OpenCode finished with exit code: ${exitCode}, done: ${doneMatch}\n`);
        
        resolve({
          stdout: stdout + (doneMatch ? '\n[DONE]' : ''),
          stderr,
          exitCode,
          errorHash: computeErrorHash(stderr || stdout)
        });
      });

      child.on('error', (err) => {
        clearTimeout(timeout);
        resolve({
          stdout: '',
          stderr: err.message,
          exitCode: -1,
          errorHash: computeErrorHash(err.message)
        });
      });
    });
  }

  async isAvailable(): Promise<boolean> {
    if (this.isServerMode) {
      return new Promise((resolve) => {
        http.get(this.serverUrl, (res) => resolve(res?.statusCode === 200))
          .on('error', () => resolve(false));
      });
    } else {
      return new Promise((resolve) => {
        const child = spawn('opencode', ['--version']);
        child.on('close', (code) => resolve(code === 0));
        child.on('error', () => resolve(false));
      });
    }
  }
}

export function createOpenCodeProvider(serverUrl?: string, isServerMode: boolean = false): Provider {
  return new OpenCodeProvider(serverUrl, isServerMode);
}

export function createServerProvider(serverUrl: string = 'http://localhost:8080'): Provider {
  return new OpenCodeProvider(serverUrl, true);
}