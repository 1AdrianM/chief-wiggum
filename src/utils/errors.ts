export class ChiefWiggumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChiefWiggumError';
  }
}

export class StateError extends ChiefWiggumError {
  constructor(message: string) {
    super(message);
    this.name = 'StateError';
  }
}

export class ExecutionError extends ChiefWiggumError {
  public exitCode: number;
  public stderr: string;

  constructor(message: string, exitCode: number = -1, stderr: string = '') {
    super(message);
    this.name = 'ExecutionError';
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

export class ValidationError extends ChiefWiggumError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ProviderError extends ChiefWiggumError {
  public provider: string;
  public statusCode?: number;

  constructor(message: string, provider: string, statusCode?: number) {
    super(message);
    this.name = 'ProviderError';
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

export class FallbackError extends ChiefWiggumError {
  public primaryProvider: string;
  public secondaryProvider: string;

  constructor(message: string, primaryProvider: string, secondaryProvider: string) {
    super(message);
    this.name = 'FallbackError';
    this.primaryProvider = primaryProvider;
    this.secondaryProvider = secondaryProvider;
  }
}

export function computeErrorHash(error: string): string {
  let hash = 0;
  for (let i = 0; i < error.length; i++) {
    const char = error.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}