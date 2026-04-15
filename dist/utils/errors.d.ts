export declare class ChiefWiggumError extends Error {
    constructor(message: string);
}
export declare class StateError extends ChiefWiggumError {
    constructor(message: string);
}
export declare class ExecutionError extends ChiefWiggumError {
    exitCode: number;
    stderr: string;
    constructor(message: string, exitCode?: number, stderr?: string);
}
export declare class ValidationError extends ChiefWiggumError {
    constructor(message: string);
}
export declare class ProviderError extends ChiefWiggumError {
    provider: string;
    statusCode?: number;
    constructor(message: string, provider: string, statusCode?: number);
}
export declare class FallbackError extends ChiefWiggumError {
    primaryProvider: string;
    secondaryProvider: string;
    constructor(message: string, primaryProvider: string, secondaryProvider: string);
}
export declare function computeErrorHash(error: string): string;
//# sourceMappingURL=errors.d.ts.map