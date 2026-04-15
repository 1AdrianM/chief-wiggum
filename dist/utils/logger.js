"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.logger = exports.LogLevel = void 0;
const fs_1 = __importDefault(require("fs"));
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(logFile = 'chief-wiggum.log') {
        this.logEntries = [];
        this.logFile = logFile;
    }
    formatEntry(entry) {
        const taskInfo = entry.taskId ? ` [Task ${entry.taskId}]` : '';
        const retryInfo = entry.retries !== undefined ? ` [Retries: ${entry.retries}]` : '';
        const errorInfo = entry.error ? ` [Error: ${entry.error}]` : '';
        return `[${entry.timestamp}] [${entry.level}]${taskInfo}${retryInfo}: ${entry.message}${errorInfo}`;
    }
    log(level, message, options) {
        const entry = {
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
            fs_1.default.appendFileSync(this.logFile, formatted + '\n');
        }
        catch (err) {
            console.error('Failed to write to log file:', err);
        }
    }
    debug(message, options) {
        this.log(LogLevel.DEBUG, message, options);
    }
    info(message, options) {
        this.log(LogLevel.INFO, message, options);
    }
    warn(message, options) {
        this.log(LogLevel.WARN, message, options);
    }
    error(message, options) {
        this.log(LogLevel.ERROR, message, options);
    }
    getEntries() {
        return [...this.logEntries];
    }
    clear() {
        this.logEntries = [];
    }
}
exports.Logger = Logger;
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map