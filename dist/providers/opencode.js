"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenCodeCLIProvider = void 0;
exports.createOpenCodeProvider = createOpenCodeProvider;
exports.isInvalidHelpOutput = isInvalidHelpOutput;
const child_process_1 = require("child_process");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
function isInvalidHelpOutput(output) {
    const trimmed = output.trim();
    return trimmed.includes('Commands:') && trimmed.includes('opencode');
}
class OpenCodeCLIProvider {
    constructor() {
        this.name = 'opencode';
    }
    async execute(prompt) {
        return new Promise((resolve) => {
            const args = ['run', prompt];
            const child = (0, child_process_1.spawn)('opencode', args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: false
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
                const exitCode = code ?? -1;
                if (isInvalidHelpOutput(stdout)) {
                    const errMsg = 'Invalid OpenCode invocation: received help output instead of execution';
                    logger_1.logger.error(errMsg);
                    resolve({
                        stdout: '',
                        stderr: errMsg,
                        exitCode: -1,
                        errorHash: (0, errors_1.computeErrorHash)(errMsg)
                    });
                    return;
                }
                const errorHash = (0, errors_1.computeErrorHash)(stderr || stdout);
                logger_1.logger.debug(`OpenCode execution completed`, {
                    retries: 0
                });
                resolve({
                    stdout,
                    stderr,
                    exitCode,
                    errorHash
                });
            });
            child.on('error', (err) => {
                const errorHash = (0, errors_1.computeErrorHash)(err.message);
                resolve({
                    stdout: '',
                    stderr: err.message,
                    exitCode: -1,
                    errorHash
                });
            });
        });
    }
    async isAvailable() {
        return new Promise((resolve) => {
            const child = (0, child_process_1.spawn)('opencode', ['--version']);
            child.on('close', (code) => {
                resolve(code === 0);
            });
            child.on('error', () => {
                resolve(false);
            });
        });
    }
}
exports.OpenCodeCLIProvider = OpenCodeCLIProvider;
function createOpenCodeProvider() {
    return new OpenCodeCLIProvider();
}
//# sourceMappingURL=opencode.js.map