export interface LoopConfig {
    verifyCommand: string;
    maxIterations?: number;
    workdir?: string;
    cooldownMinutes?: number;
}
export declare class SupervisorLoop {
    private config;
    private fallbackManager;
    private totalIterations;
    private running;
    private success;
    constructor(config?: Partial<LoopConfig>);
    start(): Promise<boolean>;
    stop(): void;
    isSuccess(): boolean;
    private iteration;
    private executeCurrentTask;
    private handleExecutionResult;
    private handleFailure;
}
export declare function createSupervisorLoop(config?: Partial<LoopConfig>): SupervisorLoop;
//# sourceMappingURL=loop.d.ts.map