import { logger, LogLevel } from '../utils/logger';
import { ExecutionError, ProviderError, computeErrorHash } from '../utils/errors';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  errorHash: string;
}

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

export interface OllamaProvider {
  name: string;
  execute(prompt: string): Promise<ExecutionResult>;
  isAvailable(): Promise<boolean>;
}

export class OllamaHTTPProvider implements OllamaProvider {
  public name = 'ollama';
  private config: OllamaConfig;

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:11434',
      model: config.model || 'llama2'
    };
  }

  async execute(prompt: string): Promise<ExecutionResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          stream: false
        })
      });

      if (!response.ok) {
        const statusCode = response.status;
        throw new ProviderError(
          `Ollama HTTP error: ${statusCode}`,
          this.name,
          statusCode
        );
      }

      const data = await response.json() as { response?: string };
      const stdout = data.response || '';
      
      return {
        stdout,
        stderr: '',
        exitCode: 0,
        errorHash: computeErrorHash(stdout)
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Ollama execution failed`, { error: errorMessage });
      
      return {
        stdout: '',
        stderr: errorMessage,
        exitCode: -1,
        errorHash: computeErrorHash(errorMessage)
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export function createOllamaProvider(config?: Partial<OllamaConfig>): OllamaProvider {
  return new OllamaHTTPProvider(config);
}