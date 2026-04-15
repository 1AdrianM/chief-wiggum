import { Provider, ProviderType, ProviderConfig } from './provider.interface';
import { createOpenCodeProvider } from './opencode.provider';
import { createGeminiProvider } from './gemini.provider';

export class ProviderRegistry {
  private providers: Map<ProviderType, () => Provider> = new Map();
  private configs: Map<ProviderType, ProviderConfig> = new Map();
  private priorities: ProviderType[] = [];

  constructor() {
    this.registerDefault();
  }

  private registerDefault(): void {
    // Primary: OpenCode with minimax
    this.register('opencode', createOpenCodeProvider, { type: 'opencode', priority: 1, enabled: true });
    
    // Fallback: Gemini
    this.register('gemini', () => createGeminiProvider('gemini-2.5-flash-preview-05-20'), { 
      type: 'gemini', 
      priority: 2, 
      enabled: true,
      config: {
        fallbackModel: 'gemini-3-flash-preview'
      }
    });
  }

  register(type: ProviderType, factory: () => Provider, config: ProviderConfig): void {
    this.providers.set(type, factory);
    this.configs.set(type, config);
    this.updatePriorities();
  }

  private updatePriorities(): void {
    const sorted = Array.from(this.configs.values())
      .filter(c => c.enabled !== false)
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));
    this.priorities = sorted.map(c => c.type);
  }

  get(type: ProviderType): Provider | null {
    const factory = this.providers.get(type);
    return factory ? factory() : null;
  }

  getPrimary(): Provider | null {
    for (const type of this.priorities) {
      const provider = this.get(type);
      if (provider && this.configs.get(type)?.enabled !== false) {
        return provider;
      }
    }
    return null;
  }

  getFallback(): Provider | null {
    // Find second provider in priority list (fallback)
    if (this.priorities.length > 1) {
      const fallbackType = this.priorities[1];
      const provider = this.get(fallbackType);
      if (provider && this.configs.get(fallbackType)?.enabled !== false) {
        return provider;
      }
    }
    return null;
  }

  switchToFallback(): Provider | null {
    const primary = this.getPrimary();
    if (primary) {
      this.disable(primary.type);
      const fallback = this.getPrimary();
      if (fallback) {
        return fallback;
      }
    }
    return this.getFallback();
  }

  getAll(): Provider[] {
    return this.priorities
      .map(type => this.get(type))
      .filter((p): p is Provider => p !== null);
  }

  listTypes(): ProviderType[] {
    return [...this.priorities];
  }

  isEnabled(type: ProviderType): boolean {
    return this.configs.get(type)?.enabled !== false;
  }

  enable(type: ProviderType): void {
    const config = this.configs.get(type);
    if (config) {
      config.enabled = true;
      this.updatePriorities();
    }
  }

  disable(type: ProviderType): void {
    const config = this.configs.get(type);
    if (config) {
      config.enabled = false;
      this.updatePriorities();
    }
  }
}

export function createProviderRegistry(): ProviderRegistry {
  return new ProviderRegistry();
}