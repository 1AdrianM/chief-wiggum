import { describe, it, expect, beforeEach } from 'vitest';
import { createEvent } from '../notifications/events';
import { NotificationDispatcher, createDispatcher } from '../notifications/dispatcher';

describe('Notification System', () => {
  describe('createEvent', () => {
    it('should create a task_started event', () => {
      const event = createEvent('task_started', { taskId: 1, description: 'Test task' });
      
      expect(event.type).toBe('task_started');
      expect(event.timestamp).toBeDefined();
      expect(event.payload).toHaveProperty('taskId');
    });

    it('should create a task_completed event', () => {
      const event = createEvent('task_completed', { taskId: 1 });
      
      expect(event.type).toBe('task_completed');
    });

    it('should create a task_failed event', () => {
      const event = createEvent('task_failed', { taskId: 1, error: 'Error message' });
      
      expect(event.type).toBe('task_failed');
      expect(event.payload).toHaveProperty('error');
    });
  });

  describe('NotificationDispatcher', () => {
    let dispatcher: NotificationDispatcher;
    let callCount: number;

    beforeEach(() => {
      dispatcher = createDispatcher();
      callCount = 0;
    });

    it('should emit events to handlers', () => {
      dispatcher.on('task_started', () => { callCount++; });
      dispatcher.emit('task_started', { taskId: 1 });
      
      expect(callCount).toBe(1);
    });

    it('should emit events to global handlers', () => {
      dispatcher.onAny(() => { callCount++; });
      dispatcher.emit('task_started', { taskId: 1 });
      
      expect(callCount).toBe(1);
    });

    it('should support multiple handlers', () => {
      dispatcher.on('task_started', () => { callCount++; });
      dispatcher.on('task_started', () => { callCount++; });
      dispatcher.emit('task_started', { taskId: 1 });
      
      expect(callCount).toBe(2);
    });

    it('should clear handlers', () => {
      dispatcher.on('task_started', () => { callCount++; });
      dispatcher.clear();
      dispatcher.emit('task_started', { taskId: 1 });
      
      expect(callCount).toBe(0);
    });

    it('should not call handlers for different event types', () => {
      dispatcher.on('task_started', () => { callCount++; });
      dispatcher.emit('task_completed', { taskId: 1 });
      
      expect(callCount).toBe(0);
    });
  });
});