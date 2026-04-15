import { logger } from '../utils/logger';
import { ProviderError } from '../utils/errors';
import { OpenCodeProvider, createOpenCodeProvider } from '../providers/opencode';
import { OllamaProvider, createOllamaProvider } from '../providers/ollama';

export type Provider = OpenCodeProvider | OllamaProvider;
export type ProviderType = 'opencode' | 'ollama';

export interface FallbackConfig {
  cooldownMinutes: number;
  maxRetries: number;
}

export class FallbackManager {
  private primaryProvider: Provider;
  private fallbackProvider: Provider;
  private currentProvider: ProviderType = 'opencode';
  private lastPrimaryFailure: number | null = null;
  private config: FallbackConfig;

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = {
      cooldownMinutes: config.cooldownMinutes || 10,
      maxRetries: config.maxRetries || 3
    };
    this.primaryProvider = createOpenCodeProvider();
    this.fallbackProvider = createOllamaProvider();
  }

  async getProvider(): Promise<Provider> {
    if (this.shouldFallback()) {
      logger.warn(`Fallback triggered: switching to ${this.fallbackProvider.name}`);
      return this.fallbackProvider;
    }

    const isAvailable = await this.primaryProvider.isAvailable();
    if (!isAvailable) {
      logger.warn(`Primary provider unavailable, using fallback`);
      return this.fallbackProvider;
    }

    return this.primaryProvider;
  }

  shouldFallback(): boolean {
    if (this.lastPrimaryFailure === null) {
      return false;
    }

    const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
    const timeSinceFailure = Date.now() - this.lastPrimaryFailure;
    return timeSinceFailure < cooldownMs;
  }

  async handleFailure(error: ProviderError): Promise<void> {
    if (this.currentProvider === 'opencode' && error.statusCode) {
      if (error.statusCode === 429 || error.statusCode >= 500) {
        this.lastPrimaryFailure = Date.now();
        logger.warn(`Primary provider failed with ${error.statusCode}, will fallback`);
      }
    }
  }

  isUsingFallback(): boolean {
    return this.currentProvider === 'ollama';
  }

  getCurrentProviderName(): string {
    return this.currentProvider;
  }
}

export function createFallbackManager(config?: Partial<FallbackConfig>): FallbackManager {
  return new FallbackManager(config);
}