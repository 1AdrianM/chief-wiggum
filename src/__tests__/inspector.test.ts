import { describe, it, expect } from 'vitest';
import { FailureInspector, createInspector } from '../inspector/inspector';

describe('FailureInspector', () => {
  describe('constructor', () => {
    it('should create inspector with default maxRetries', () => {
      const inspector = createInspector();
      expect(inspector).toBeDefined();
    });

    it('should create inspector with custom maxRetries', () => {
      const inspector = createInspector(5);
      expect(inspector).toBeDefined();
    });
  });

  describe('setMode', () => {
    it('should set execution mode', () => {
      const inspector = createInspector();
      inspector.setMode('debug');
      inspector.setMode('build');
      inspector.setMode('plan');
    });
  });

  describe('shouldRun', () => {
    it('should run in debug mode always', () => {
      const inspector = createInspector();
      inspector.setMode('debug');
      
      expect(inspector.shouldRun(null, 0)).toBe(true);
      expect(inspector.shouldRun('error', 0)).toBe(true);
    });

    it('should not run when no error in build mode', () => {
      const inspector = createInspector();
      inspector.setMode('build');
      
      expect(inspector.shouldRun(null, 0)).toBe(false);
    });

    it('should run when error exists in build mode', () => {
      const inspector = createInspector();
      inspector.setMode('build');
      
      expect(inspector.shouldRun('Some error', 1)).toBe(true);
    });
  });
});