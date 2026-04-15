"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackManager = void 0;
exports.createFallbackManager = createFallbackManager;
const logger_1 = require("../utils/logger");
const opencode_1 = require("../providers/opencode");
const ollama_1 = require("../providers/ollama");
class FallbackManager {
    constructor(config = {}) {
        this.currentProvider = 'opencode';
        this.lastPrimaryFailure = null;
        this.config = {
            cooldownMinutes: config.cooldownMinutes || 10,
            maxRetries: config.maxRetries || 3
        };
        this.primaryProvider = (0, opencode_1.createOpenCodeProvider)();
        this.fallbackProvider = (0, ollama_1.createOllamaProvider)();
    }
    async getProvider() {
        if (this.shouldFallback()) {
            logger_1.logger.warn(`Fallback triggered: switching to ${this.fallbackProvider.name}`);
            return this.fallbackProvider;
        }
        const isAvailable = await this.primaryProvider.isAvailable();
        if (!isAvailable) {
            logger_1.logger.warn(`Primary provider unavailable, using fallback`);
            return this.fallbackProvider;
        }
        return this.primaryProvider;
    }
    shouldFallback() {
        if (this.lastPrimaryFailure === null) {
            return false;
        }
        const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
        const timeSinceFailure = Date.now() - this.lastPrimaryFailure;
        return timeSinceFailure < cooldownMs;
    }
    async handleFailure(error) {
        if (this.currentProvider === 'opencode' && error.statusCode) {
            if (error.statusCode === 429 || error.statusCode >= 500) {
                this.lastPrimaryFailure = Date.now();
                logger_1.logger.warn(`Primary provider failed with ${error.statusCode}, will fallback`);
            }
        }
    }
    isUsingFallback() {
        return this.currentProvider === 'ollama';
    }
    getCurrentProviderName() {
        return this.currentProvider;
    }
}
exports.FallbackManager = FallbackManager;
function createFallbackManager(config) {
    return new FallbackManager(config);
}
//# sourceMappingURL=fallback.js.map