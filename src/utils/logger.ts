import fs from 'fs';
import path from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  taskId?: number;
  retries?: number;
  error?: string;
}

class Logger {
  private logFile: string;
  private logEntries: LogEntry[] = [];

  constructor(logFile: string = 'chief-wiggum.log') {
    this.logFile = logFile;
  }

  private formatEntry(entry: LogEntry): string {
    const taskInfo = entry.taskId ? ` [Task ${entry.taskId}]` : '';
    const retryInfo = entry.retries !== undefined ? ` [Retries: ${entry.retries}]` : '';
    const errorInfo = entry.error ? ` [Error: ${entry.error}]` : '';
    return `[${entry.timestamp}] [${entry.level}]${taskInfo}${retryInfo}: ${entry.message}${errorInfo}`;
  }

  log(level: LogLevel, message: string, options?: { taskId?: number; retries?: number; error?: string }): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      taskId: options?.taskId,
      retries: options?.retries,
      error: options?.error
    };

    this.logEntries.push(entry);
    const formatted = this.formatEntry(entry);
    console.log(formatted);

    try {
      fs.appendFileSync(this.logFile, formatted + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  debug(message: string, options?: { taskId?: number; retries?: number }): void {
    this.log(LogLevel.DEBUG, message, options);
  }

  info(message: string, options?: { taskId?: number; retries?: number }): void {
    this.log(LogLevel.INFO, message, options);
  }

  warn(message: string, options?: { taskId?: number; retries?: number }): void {
    this.log(LogLevel.WARN, message, options);
  }

  error(message: string, options?: { taskId?: number; retries?: number; error?: string }): void {
    this.log(LogLevel.ERROR, message, options);
  }

  getEntries(): LogEntry[] {
    return [...this.logEntries];
  }

  clear(): void {
    this.logEntries = [];
  }
}

export const logger = new Logger();
export { Logger, LogEntry };