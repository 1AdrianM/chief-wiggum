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
declare function isInvalidHelpOutput(output: string): boolean;
export declare class OpenCodeCLIProvider implements OpenCodeProvider {
    name: string;
    execute(prompt: string): Promise<ExecutionResult>;
    isAvailable(): Promise<boolean>;
}
export declare function createOpenCodeProvider(): OpenCodeProvider;
export { isInvalidHelpOutput };
//# sourceMappingURL=opencode.d.ts.map