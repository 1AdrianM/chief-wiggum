import { spawn } from 'child_process';
import http from 'http';
import { Provider, ProviderType, ProviderContext } from './provider.interface';
import { ExecutionResult } from '../types';
import { computeErrorHash } from '../utils/errors';

export class GeminiProvider implements Provider {
  public readonly name = 'gemini';
  public readonly type: ProviderType = 'gemini';
  private model: string = 'gemini-2.5-flash-preview-05-20';
  
  constructor(model?: string) {
    if (model) this.model = model;
  }

  async execute(prompt: string, context?: ProviderContext): Promise<ExecutionResult> {
    return this.executeDirect(prompt, context);
  }

  private async executeDirect(prompt: string, context?: ProviderContext): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      console.log(`\n>>> Gemini Prompt: ${prompt.substring(0, 100)}...\n`);
      
      // Use opencode with gemini model as the execution method
      const child = spawn('opencode', ['run', '-m', `google/${this.model}`, prompt], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        cwd: context?.workdir || process.cwd()
      });

      let stdout = '';
      let stderr = '';

      // Set timeout
      const timeoutMs = context?.timeout || 120000;
      const timeout = setTimeout(() => {
        console.log(`\n<<< Gemini timed out after ${timeoutMs}ms\n`);
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
        
        const doneMatch = stdout.includes('[DONE]');
        
        console.log(`\n<<< Gemini finished with exit code: ${exitCode}, done: ${doneMatch}\n`);
        
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
    // Check if opencode with gemini is available
    return new Promise((resolve) => {
      const child = spawn('opencode', ['models']);
      let output = '';
      
      child.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', () => {
        resolve(output.includes('gemini'));
      });
      
      child.on('error', () => {
        resolve(false);
      });
    });
  }
  
  setModel(model: string): void {
    this.model = model;
  }
}

export function createGeminiProvider(model?: string): Provider {
  return new GeminiProvider(model);
}