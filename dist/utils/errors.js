"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackError = exports.ProviderError = exports.ValidationError = exports.ExecutionError = exports.StateError = exports.ChiefWiggumError = void 0;
exports.computeErrorHash = computeErrorHash;
class ChiefWiggumError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ChiefWiggumError';
    }
}
exports.ChiefWiggumError = ChiefWiggumError;
class StateError extends ChiefWiggumError {
    constructor(message) {
        super(message);
        this.name = 'StateError';
    }
}
exports.StateError = StateError;
class ExecutionError extends ChiefWiggumError {
    constructor(message, exitCode = -1, stderr = '') {
        super(message);
        this.name = 'ExecutionError';
        this.exitCode = exitCode;
        this.stderr = stderr;
    }
}
exports.ExecutionError = ExecutionError;
class ValidationError extends ChiefWiggumError {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class ProviderError extends ChiefWiggumError {
    constructor(message, provider, statusCode) {
        super(message);
        this.name = 'ProviderError';
        this.provider = provider;
        this.statusCode = statusCode;
    }
}
exports.ProviderError = ProviderError;
class FallbackError extends ChiefWiggumError {
    constructor(message, primaryProvider, secondaryProvider) {
        super(message);
        this.name = 'FallbackError';
        this.primaryProvider = primaryProvider;
        this.secondaryProvider = secondaryProvider;
    }
}
exports.FallbackError = FallbackError;
function computeErrorHash(error) {
    let hash = 0;
    for (let i = 0; i < error.length; i++) {
        const char = error.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}
//# sourceMappingURL=errors.js.map