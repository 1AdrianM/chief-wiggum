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
    constructor(config?: Partial<LoopConfig>);
    start(): Promise<void>;
    stop(): void;
    private iteration;
    private executeCurrentTask;
    private handleExecutionResult;
    private handleFailure;
}
export declare function createSupervisorLoop(config?: Partial<LoopConfig>): SupervisorLoop;
//# sourceMappingURL=loop.d.ts.map