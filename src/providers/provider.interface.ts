import { ExecutionResult } from '../types';

export interface Provider {
  name: string;
  type: ProviderType;
  execute(prompt: string, context?: ProviderContext): Promise<ExecutionResult>;
  isAvailable(): Promise<boolean>;
}

export type ProviderType = 'opencode' | 'claude-code' | 'codex' | 'gemini';

export interface ProviderContext {
  workdir?: string;
  timeout?: number;
  model?: string;
}

export interface ProviderFactory {
  create(): Provider;
}

export interface ProviderConfig {
  type: ProviderType;
  priority?: number;
  enabled?: boolean;
  config?: Record<string, unknown>;
}