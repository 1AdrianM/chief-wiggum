import { execSync, exec } from 'child_process';
import { logger, LogLevel } from './logger';

export interface GitStatusResult {
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
}

export async function getGitStatus(): Promise<GitStatusResult> {
  const result: GitStatusResult = {
    modified: [],
    added: [],
    deleted: [],
    untracked: []
  };

  try {
    const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
    const lines = statusOutput.trim().split('\n');

    for (const line of lines) {
      if (line.length < 2) continue;
      const status = line.substring(0, 2);
      const file = line.substring(3);

      if (status.includes('M')) result.modified.push(file);
      if (status.includes('A')) result.added.push(file);
      if (status.includes('D')) result.deleted.push(file);
      if (status.includes('?') || status.includes('!!')) result.untracked.push(file);
    }
  } catch (err) {
    logger.error('Failed to get git status', { error: String(err) });
  }

  return result;
}

export function hasPendingChanges(): boolean {
  try {
    const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
    return statusOutput.trim().length > 0;
  } catch {
    return false;
  }
}

export function gitCommit(message: string): boolean {
  try {
    execSync('git add -A', { encoding: 'utf8' });
    execSync(`git commit -m "${message}"`, { encoding: 'utf8' });
    logger.info(`Committed: ${message}`);
    return true;
  } catch (err) {
    logger.error(`Failed to commit: ${message}`, { error: String(err) });
    return false;
  }
}

export function gitAdd(files: string[]): boolean {
  try {
    execSync(`git add ${files.join(' ')}`, { encoding: 'utf8' });
    return true;
  } catch (err) {
    logger.error('Failed to git add files', { error: String(err) });
    return false;
  }
}

export function gitRevertLast(): boolean {
  try {
    execSync('git reset --hard HEAD~1', { encoding: 'utf8' });
    logger.info('Reverted last commit');
    return true;
  } catch (err) {
    logger.error('Failed to revert last commit', { error: String(err) });
    return false;
  }
}

export function getCurrentBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

export function gitLog(limit: number = 5): string {
  try {
    return execSync(`git log --oneline -n ${limit}`, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}