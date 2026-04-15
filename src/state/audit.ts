import fs from 'fs';
import { AuditEntry, AuditEvent } from '../types';

const AUDIT_FILE = 'audit.log';

export function appendAudit(entry: AuditEntry): void {
  const line = formatAuditEntry(entry);
  fs.appendFileSync(AUDIT_FILE, line + '\n');
}

export function formatAuditEntry(entry: AuditEntry): string {
  const parts = [
    entry.timestamp,
    entry.event,
    entry.taskId?.toString() || '-',
    entry.provider || '-',
    entry.errorHash || '-'
  ];
  
  let line = parts.join(' | ');
  
  if (entry.details) {
    line += ` | ${entry.details}`;
  }
  
  return line;
}

export function createAuditEntry(
  event: AuditEvent,
  options?: {
    taskId?: number;
    provider?: string;
    details?: string;
    errorHash?: string;
  }
): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    event,
    taskId: options?.taskId,
    provider: options?.provider,
    details: options?.details,
    errorHash: options?.errorHash
  };
}

export function readAuditLog(limit?: number): AuditEntry[] {
  try {
    const content = fs.readFileSync(AUDIT_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(l => l);
    
    if (limit) {
      return lines.slice(-limit).map(parseAuditLine).filter(e => e !== null) as AuditEntry[];
    }
    
    return lines.map(parseAuditLine).filter(e => e !== null) as AuditEntry[];
  } catch {
    return [];
  }
}

function parseAuditLine(line: string): AuditEntry | null {
  try {
    const parts = line.split(' | ');
    if (parts.length < 5) return null;
    
    return {
      timestamp: parts[0],
      event: parts[1] as AuditEvent,
      taskId: parts[2] !== '-' ? parseInt(parts[2], 10) : undefined,
      provider: parts[3] !== '-' ? parts[3] : undefined,
      errorHash: parts[4] !== '-' ? parts[4] : undefined,
      details: parts[5] || undefined
    };
  } catch {
    return null;
  }
}

export function getLastAuditEvents(event: AuditEvent, count: number): AuditEntry[] {
  const all = readAuditLog();
  return all.filter(e => e.event === event).slice(-count);
}

export function hasRecentFailure(count: number = 3): boolean {
  const recent = readAuditLog(count);
  return recent.some(e => e.event === 'task_failed');
}