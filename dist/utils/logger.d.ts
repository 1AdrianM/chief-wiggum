export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}
interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    taskId?: number;
    retries?: number;
    error?: string;
}
declare class Logger {
    private logFile;
    private logEntries;
    constructor(logFile?: string);
    private formatEntry;
    log(level: LogLevel, message: string, options?: {
        taskId?: number;
        retries?: number;
        error?: string;
    }): void;
    debug(message: string, options?: {
        taskId?: number;
        retries?: number;
    }): void;
    info(message: string, options?: {
        taskId?: number;
        retries?: number;
    }): void;
    warn(message: string, options?: {
        taskId?: number;
        retries?: number;
    }): void;
    error(message: string, options?: {
        taskId?: number;
        retries?: number;
        error?: string;
    }): void;
    getEntries(): LogEntry[];
    clear(): void;
}
export declare const logger: Logger;
export { Logger, LogEntry };
//# sourceMappingURL=logger.d.ts.map