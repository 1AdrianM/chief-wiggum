import { State } from './state';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare const MAX_RETRIES = 3;
export declare const MAX_TOTAL_ITERATIONS = 100;
export declare function validateState(state: State): ValidationResult;
export declare function validateStateJSON(json: string): ValidationResult;
export declare function canRetry(state: State): boolean;
export declare function shouldStop(state: State, totalIterations: number): boolean;
export declare function isRepeatedFailure(state: State, errorHash: string): boolean;
//# sourceMappingURL=validator.d.ts.map