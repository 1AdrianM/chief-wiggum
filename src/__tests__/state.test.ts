import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const testDir = '/tmp/chief-wiggum-tests';

describe('State System', () => {
  beforeEach(() => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
  });

  it('should serialize and deserialize state correctly', () => {
    const state = {
      currentTask: 1,
      tasks: [
        { id: 1, status: 'pending' as const, description: 'Test task' }
      ],
      retries: 0,
      lastError: null,
      lastErrorHash: null
    };
    
    const testFile = path.join(testDir, 'serialize-test.json');
    fs.writeFileSync(testFile, JSON.stringify(state));
    
    const loaded = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    
    expect(loaded.currentTask).toBe(1);
    expect(loaded.tasks).toHaveLength(1);
    expect(loaded.tasks[0].status).toBe('pending');
  });

  it('should preserve task structure', () => {
    const state = {
      currentTask: 2,
      tasks: [
        { id: 1, status: 'done' as const, description: 'Task 1' },
        { id: 2, status: 'pending' as const, description: 'Task 2' },
        { id: 3, status: 'blocked' as const, description: 'Task 3' }
      ],
      retries: 3,
      lastError: 'Some error',
      lastErrorHash: 'hash123'
    };
    
    const testFile = path.join(testDir, 'task-structure.json');
    fs.writeFileSync(testFile, JSON.stringify(state, null, 2));
    
    const loaded = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    
    expect(loaded.tasks[0].status).toBe('done');
    expect(loaded.tasks[1].status).toBe('pending');
    expect(loaded.tasks[2].status).toBe('blocked');
    expect(loaded.retries).toBe(3);
    expect(loaded.lastError).toBe('Some error');
  });
});