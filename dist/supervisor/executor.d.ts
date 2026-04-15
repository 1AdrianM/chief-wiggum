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
export declare function executeTask(provider: Provider, taskDescription: string, config?: ExecutorConfig): Promise<ExecutionResult>;
export declare function runVerification(verifyCommand: string, workdir?: string): Promise<boolean>;
export declare function parseOutput(output: string): {
    done: boolean;
    hasError: boolean;
};
//# sourceMappingURL=executor.d.ts.map