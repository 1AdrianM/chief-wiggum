import { describe, it, expect } from 'vitest';
import { createOpenCodeProvider, createServerProvider } from '../providers/opencode.provider';

describe('OpenCodeProvider', () => {
  describe('constructor', () => {
    it('should create provider instance', () => {
      const provider = createOpenCodeProvider();
      
      expect(provider.name).toBe('opencode');
      expect(provider.type).toBe('opencode');
    });
  });

  describe('isAvailable', () => {
    it('should have isAvailable method', async () => {
      const provider = createOpenCodeProvider();
      
      expect(typeof provider.isAvailable).toBe('function');
    }, 10000);
  });
});

describe('createServerProvider', () => {
  it('should create a server provider instance', () => {
    const provider = createServerProvider('http://localhost:8080');
    
    expect(provider.name).toBe('opencode');
    expect(provider.type).toBe('opencode');
  });

  it('should accept custom server URL', () => {
    const provider = createServerProvider('http://custom:9000');
    expect(provider).toBeDefined();
  });
});