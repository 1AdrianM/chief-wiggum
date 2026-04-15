"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupervisorLoop = void 0;
exports.createSupervisorLoop = createSupervisorLoop;
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const state_1 = require("./state");
const validator_1 = require("./validator");
const executor_1 = require("./executor");
const fallback_1 = require("./fallback");
const git_1 = require("../utils/git");
class SupervisorLoop {
    constructor(config = {}) {
        this.totalIterations = 0;
        this.running = false;
        this.config = {
            verifyCommand: config.verifyCommand || 'npm run build',
            maxIterations: config.maxIterations || 100,
            workdir: config.workdir,
            cooldownMinutes: config.cooldownMinutes || 10
        };
        const fallbackConfig = {
            cooldownMinutes: config.cooldownMinutes || 10,
            maxRetries: validator_1.MAX_RETRIES
        };
        this.fallbackManager = (0, fallback_1.createFallbackManager)(fallbackConfig);
    }
    async start() {
        this.running = true;
        logger_1.logger.info('Supervisor loop started');
        while (this.running) {
            if ((0, validator_1.shouldStop)((0, state_1.loadState)(), this.totalIterations)) {
                logger_1.logger.warn('Stop condition reached');
                break;
            }
            await this.iteration();
            this.totalIterations++;
            if ((0, state_1.areAllTasksDone)()) {
                logger_1.logger.info('All tasks completed');
                break;
            }
        }
        logger_1.logger.info(`Supervisor loop finished after ${this.totalIterations} iterations`);
    }
    stop() {
        this.running = false;
        logger_1.logger.info('Supervisor loop stopped');
    }
    async iteration() {
        logger_1.logger.info(`Starting iteration ${this.totalIterations + 1}`);
        const state = (0, state_1.loadState)();
        const validation = (0, validator_1.validateState)(state);
        if (!validation.valid) {
            logger_1.logger.error(`Invalid state: ${validation.errors.join(', ')}`);
            this.running = false;
            return;
        }
        const currentTask = (0, state_1.getCurrentTask)();
        if (!currentTask) {
            const nextTask = (0, state_1.getNextPendingTask)();
            if (!nextTask) {
                logger_1.logger.info('No pending tasks found');
                this.running = false;
                return;
            }
            logger_1.logger.info(`Starting task ${nextTask.id}: ${nextTask.description}`);
        }
        try {
            const result = await this.executeCurrentTask();
            await this.handleExecutionResult(result);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger_1.logger.error(`Iteration error: ${message}`);
        }
    }
    async executeCurrentTask() {
        const state = (0, state_1.loadState)();
        const task = (0, state_1.getCurrentTask)() || (0, state_1.getNextPendingTask)();
        if (!task) {
            return {
                stdout: '[DONE]',
                stderr: '',
                exitCode: 0,
                errorHash: ''
            };
        }
        const provider = await this.fallbackManager.getProvider();
        return (0, executor_1.executeTask)(provider, task.description, { workdir: this.config.workdir });
    }
    async handleExecutionResult(result) {
        const state = (0, state_1.loadState)();
        const parsed = (0, executor_1.parseOutput)(result.stdout);
        if (result.exitCode !== 0) {
            await this.handleFailure(result.stderr || result.stdout);
            return;
        }
        if (parsed.done) {
            logger_1.logger.info('Task completed: [DONE] detected');
            if ((0, git_1.hasPendingChanges)()) {
                (0, git_1.gitCommit)(`Task ${state.currentTask} completed`);
            }
            const verified = await (0, executor_1.runVerification)(this.config.verifyCommand, this.config.workdir);
            if (verified) {
                (0, state_1.advanceToNextTask)();
                (0, state_1.clearLastError)();
                (0, state_1.resetRetries)();
            }
            else {
                logger_1.logger.error('Verification failed, will retry');
                (0, state_1.setLastError)('Verification failed', (0, errors_1.computeErrorHash)('verification failed'));
            }
            return;
        }
        if (parsed.hasError) {
            await this.handleFailure(result.stdout);
            return;
        }
        (0, state_1.advanceToNextTask)();
        (0, state_1.clearLastError)();
        (0, state_1.resetRetries)();
    }
    async handleFailure(errorMessage) {
        const state = (0, state_1.loadState)();
        const errorHash = (0, errors_1.computeErrorHash)(errorMessage);
        if ((0, validator_1.isRepeatedFailure)(state, errorHash)) {
            logger_1.logger.error('Repeated failure detected, rolling back');
            if ((0, git_1.hasPendingChanges)()) {
                (0, git_1.gitRevertLast)();
                (0, state_1.incrementRetries)();
            }
            (0, state_1.setLastError)(errorMessage, errorHash);
            if ((0, validator_1.canRetry)(state)) {
                return;
            }
            logger_1.logger.error('Max retries exceeded, blocking task');
            this.running = false;
            return;
        }
        (0, state_1.incrementRetries)();
        (0, state_1.setLastError)(errorMessage, errorHash);
    }
}
exports.SupervisorLoop = SupervisorLoop;
function createSupervisorLoop(config) {
    return new SupervisorLoop(config);
}
//# sourceMappingURL=loop.js.map