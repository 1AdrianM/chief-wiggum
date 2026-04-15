"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_TOTAL_ITERATIONS = exports.MAX_RETRIES = void 0;
exports.validateState = validateState;
exports.validateStateJSON = validateStateJSON;
exports.canRetry = canRetry;
exports.shouldStop = shouldStop;
exports.isRepeatedFailure = isRepeatedFailure;
const logger_1 = require("../utils/logger");
exports.MAX_RETRIES = 3;
exports.MAX_TOTAL_ITERATIONS = 100;
function validateState(state) {
    const errors = [];
    if (!state.currentTask || state.currentTask < 1) {
        errors.push('Invalid currentTask: must be >= 1');
    }
    if (!state.tasks || !Array.isArray(state.tasks) || state.tasks.length === 0) {
        errors.push('Invalid tasks: must be a non-empty array');
    }
    else {
        for (let i = 0; i < state.tasks.length; i++) {
            const task = state.tasks[i];
            if (!task.id || !task.status || !task.description) {
                errors.push(`Task at index ${i} is missing required fields`);
            }
        }
    }
    if (state.retries < 0 || state.retries > exports.MAX_RETRIES * 10) {
        errors.push(`Invalid retries: must be between 0 and ${exports.MAX_RETRIES * 10}`);
    }
    const valid = errors.length === 0;
    return { valid, errors };
}
function validateStateJSON(json) {
    try {
        const state = JSON.parse(json);
        return validateState(state);
    }
    catch (err) {
        return {
            valid: false,
            errors: [`Failed to parse JSON: ${err}`]
        };
    }
}
function canRetry(state) {
    return state.retries < exports.MAX_RETRIES;
}
function shouldStop(state, totalIterations) {
    if (totalIterations >= exports.MAX_TOTAL_ITERATIONS) {
        logger_1.logger.warn(`Max total iterations (${exports.MAX_TOTAL_ITERATIONS}) reached`);
        return true;
    }
    return false;
}
function isRepeatedFailure(state, errorHash) {
    return state.lastErrorHash === errorHash && state.lastError !== null;
}
//# sourceMappingURL=validator.js.map