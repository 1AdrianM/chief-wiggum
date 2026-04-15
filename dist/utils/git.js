"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitStatus = getGitStatus;
exports.hasPendingChanges = hasPendingChanges;
exports.gitCommit = gitCommit;
exports.gitAdd = gitAdd;
exports.gitRevertLast = gitRevertLast;
exports.getCurrentBranch = getCurrentBranch;
exports.gitLog = gitLog;
const child_process_1 = require("child_process");
const logger_1 = require("./logger");
async function getGitStatus() {
    const result = {
        modified: [],
        added: [],
        deleted: [],
        untracked: []
    };
    try {
        const statusOutput = (0, child_process_1.execSync)('git status --porcelain', { encoding: 'utf8' });
        const lines = statusOutput.trim().split('\n');
        for (const line of lines) {
            if (line.length < 2)
                continue;
            const status = line.substring(0, 2);
            const file = line.substring(3);
            if (status.includes('M'))
                result.modified.push(file);
            if (status.includes('A'))
                result.added.push(file);
            if (status.includes('D'))
                result.deleted.push(file);
            if (status.includes('?') || status.includes('!!'))
                result.untracked.push(file);
        }
    }
    catch (err) {
        logger_1.logger.error('Failed to get git status', { error: String(err) });
    }
    return result;
}
function hasPendingChanges() {
    try {
        const statusOutput = (0, child_process_1.execSync)('git status --porcelain', { encoding: 'utf8' });
        return statusOutput.trim().length > 0;
    }
    catch {
        return false;
    }
}
function gitCommit(message) {
    try {
        (0, child_process_1.execSync)('git add -A', { encoding: 'utf8' });
        (0, child_process_1.execSync)(`git commit -m "${message}"`, { encoding: 'utf8' });
        logger_1.logger.info(`Committed: ${message}`);
        return true;
    }
    catch (err) {
        logger_1.logger.error(`Failed to commit: ${message}`, { error: String(err) });
        return false;
    }
}
function gitAdd(files) {
    try {
        (0, child_process_1.execSync)(`git add ${files.join(' ')}`, { encoding: 'utf8' });
        return true;
    }
    catch (err) {
        logger_1.logger.error('Failed to git add files', { error: String(err) });
        return false;
    }
}
function gitRevertLast() {
    try {
        (0, child_process_1.execSync)('git reset --hard HEAD~1', { encoding: 'utf8' });
        logger_1.logger.info('Reverted last commit');
        return true;
    }
    catch (err) {
        logger_1.logger.error('Failed to revert last commit', { error: String(err) });
        return false;
    }
}
function getCurrentBranch() {
    try {
        return (0, child_process_1.execSync)('git branch --show-current', { encoding: 'utf8' }).trim();
    }
    catch {
        return 'unknown';
    }
}
function gitLog(limit = 5) {
    try {
        return (0, child_process_1.execSync)(`git log --oneline -n ${limit}`, { encoding: 'utf8' }).trim();
    }
    catch {
        return '';
    }
}
//# sourceMappingURL=git.js.map