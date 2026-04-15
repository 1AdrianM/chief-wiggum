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
export declare class OllamaHTTPProvider implements OllamaProvider {
    name: string;
    private config;
    constructor(config?: Partial<OllamaConfig>);
    execute(prompt: string): Promise<ExecutionResult>;
    isAvailable(): Promise<boolean>;
}
export declare function createOllamaProvider(config?: Partial<OllamaConfig>): OllamaProvider;
//# sourceMappingURL=ollama.d.ts.map