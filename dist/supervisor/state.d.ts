export interface Task {
    id: number;
    status: 'pending' | 'done' | 'blocked' | 'failed';
    description: string;
}
export interface State {
    currentTask: number;
    tasks: Task[];
    retries: number;
    lastError: string | null;
    lastErrorHash: string | null;
}
export declare function loadState(): State;
export declare function saveState(state: State): void;
export declare function updateTaskStatus(taskId: number, status: Task['status']): void;
export declare function getCurrentTask(): Task | null;
export declare function getPendingTasks(): Task[];
export declare function getNextPendingTask(): Task | null;
export declare function areAllTasksDone(): boolean;
export declare function incrementRetries(): number;
export declare function resetRetries(): void;
export declare function setLastError(error: string, errorHash: string): void;
export declare function clearLastError(): void;
export declare function advanceToNextTask(): void;
//# sourceMappingURL=state.d.ts.map