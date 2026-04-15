export interface GitStatusResult {
    modified: string[];
    added: string[];
    deleted: string[];
    untracked: string[];
}
export declare function getGitStatus(): Promise<GitStatusResult>;
export declare function hasPendingChanges(): boolean;
export declare function hasCommits(): boolean;
export declare function gitCommit(message: string): boolean;
export declare function gitAdd(files: string[]): boolean;
export declare function gitRevertLast(): boolean;
export declare function getCurrentBranch(): string;
export declare function gitLog(limit?: number): string;
//# sourceMappingURL=git.d.ts.map