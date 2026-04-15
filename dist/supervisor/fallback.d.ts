import { ProviderError } from '../utils/errors';
import { OpenCodeProvider } from '../providers/opencode';
import { OllamaProvider } from '../providers/ollama';
export type Provider = OpenCodeProvider | OllamaProvider;
export type ProviderType = 'opencode' | 'ollama';
export interface FallbackConfig {
    cooldownMinutes: number;
    maxRetries: number;
}
export declare class FallbackManager {
    private primaryProvider;
    private fallbackProvider;
    private currentProvider;
    private lastPrimaryFailure;
    private config;
    constructor(config?: Partial<FallbackConfig>);
    getProvider(): Promise<Provider>;
    shouldFallback(): boolean;
    handleFailure(error: ProviderError): Promise<void>;
    isUsingFallback(): boolean;
    getCurrentProviderName(): string;
}
export declare function createFallbackManager(config?: Partial<FallbackConfig>): FallbackManager;
//# sourceMappingURL=fallback.d.ts.map