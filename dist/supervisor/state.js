"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadState = loadState;
exports.saveState = saveState;
exports.updateTaskStatus = updateTaskStatus;
exports.getCurrentTask = getCurrentTask;
exports.getPendingTasks = getPendingTasks;
exports.getNextPendingTask = getNextPendingTask;
exports.areAllTasksDone = areAllTasksDone;
exports.incrementRetries = incrementRetries;
exports.resetRetries = resetRetries;
exports.setLastError = setLastError;
exports.clearLastError = clearLastError;
exports.advanceToNextTask = advanceToNextTask;
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const STATE_FILE = 'progress.json';
const BACKUP_FILE = 'progress.bak.json';
function loadState() {
    try {
        const data = fs_1.default.readFileSync(STATE_FILE, 'utf8');
        return JSON.parse(data);
    }
    catch (err) {
        logger_1.logger.error(`Failed to load state`, { error: String(err) });
        throw new errors_1.StateError(`Failed to load state: ${err}`);
    }
}
function saveState(state) {
    try {
        const backupData = fs_1.default.readFileSync(STATE_FILE, 'utf8');
        fs_1.default.writeFileSync(BACKUP_FILE, backupData);
    }
    catch {
        logger_1.logger.warn('No existing state to backup');
    }
    fs_1.default.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    logger_1.logger.debug(`State saved: currentTask=${state.currentTask}`);
}
function updateTaskStatus(taskId, status) {
    const state = loadState();
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) {
        throw new errors_1.StateError(`Task ${taskId} not found`);
    }
    task.status = status;
    saveState(state);
}
function getCurrentTask() {
    const state = loadState();
    const task = state.tasks.find(t => t.id === state.currentTask);
    return task || null;
}
function getPendingTasks() {
    const state = loadState();
    return state.tasks.filter(t => t.status === 'pending');
}
function getNextPendingTask() {
    const state = loadState();
    for (const task of state.tasks) {
        if (task.status === 'pending') {
            return task;
        }
    }
    return null;
}
function areAllTasksDone() {
    const state = loadState();
    return state.tasks.every(t => t.status === 'done');
}
function incrementRetries() {
    const state = loadState();
    state.retries += 1;
    saveState(state);
    return state.retries;
}
function resetRetries() {
    const state = loadState();
    state.retries = 0;
    saveState(state);
}
function setLastError(error, errorHash) {
    const state = loadState();
    state.lastError = error;
    state.lastErrorHash = errorHash;
    saveState(state);
}
function clearLastError() {
    const state = loadState();
    state.lastError = null;
    state.lastErrorHash = null;
    saveState(state);
}
function advanceToNextTask() {
    const state = loadState();
    const currentTask = state.tasks.find(t => t.id === state.currentTask);
    if (currentTask) {
        currentTask.status = 'done';
    }
    let found = false;
    for (const task of state.tasks) {
        if (task.status === 'pending') {
            state.currentTask = task.id;
            found = true;
            break;
        }
    }
    if (!found) {
        state.currentTask = state.tasks.length + 1;
    }
    saveState(state);
}
//# sourceMappingURL=state.js.map