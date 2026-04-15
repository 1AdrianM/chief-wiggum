"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTask = executeTask;
exports.runVerification = runVerification;
exports.parseOutput = parseOutput;
const child_process_1 = require("child_process");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
async function executeTask(provider, taskDescription, config = {}) {
    const prompt = `Check progress.json and complete the next task in PRD.md. If all tasks are complete, output [DONE]. Task: ${taskDescription}`;
    logger_1.logger.info('Executing task', {
        taskId: 0,
        retries: 0
    });
    try {
        const result = await provider.execute(prompt);
        if (result.exitCode !== 0) {
            logger_1.logger.error(`Task execution failed`, {
                error: result.stderr || result.stdout
            });
        }
        else {
            logger_1.logger.info('Task execution completed');
        }
        return result;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger_1.logger.error(`Task execution error`, { error: message });
        return {
            stdout: '',
            stderr: message,
            exitCode: -1,
            errorHash: (0, errors_1.computeErrorHash)(message)
        };
    }
}
async function runVerification(verifyCommand, workdir) {
    logger_1.logger.info(`Running verification: ${verifyCommand}`);
    return new Promise((resolve) => {
        const [cmd, ...args] = verifyCommand.split(' ');
        const child = (0, child_process_1.spawn)(cmd, args, {
            cwd: workdir || process.cwd(),
            stdio: 'pipe'
        });
        let stdout = '';
        let stderr = '';
        child.stdout?.on('data', (data) => {
            stdout += data.toString();
        });
        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });
        child.on('close', (code) => {
            const success = code === 0;
            if (success) {
                logger_1.logger.info('Verification passed');
            }
            else {
                logger_1.logger.error(`Verification failed`, { error: stderr || stdout });
            }
            resolve(success);
        });
        child.on('error', (err) => {
            logger_1.logger.error(`Verification error`, { error: err.message });
            resolve(false);
        });
    });
}
function parseOutput(output) {
    const done = output.includes('[DONE]');
    const hasError = output.toLowerCase().includes('error:') ||
        output.toLowerCase().includes('failed:');
    return { done, hasError };
}
//# sourceMappingURL=executor.js.map