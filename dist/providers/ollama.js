"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaHTTPProvider = void 0;
exports.createOllamaProvider = createOllamaProvider;
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class OllamaHTTPProvider {
    constructor(config = {}) {
        this.name = 'ollama';
        this.config = {
            baseUrl: config.baseUrl || 'http://localhost:11434',
            model: config.model || 'llama2'
        };
    }
    async execute(prompt) {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.config.model,
                    prompt,
                    stream: false
                })
            });
            if (!response.ok) {
                const statusCode = response.status;
                throw new errors_1.ProviderError(`Ollama HTTP error: ${statusCode}`, this.name, statusCode);
            }
            const data = await response.json();
            const stdout = data.response || '';
            return {
                stdout,
                stderr: '',
                exitCode: 0,
                errorHash: (0, errors_1.computeErrorHash)(stdout)
            };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger_1.logger.error(`Ollama execution failed`, { error: errorMessage });
            return {
                stdout: '',
                stderr: errorMessage,
                exitCode: -1,
                errorHash: (0, errors_1.computeErrorHash)(errorMessage)
            };
        }
    }
    async isAvailable() {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`, {
                method: 'GET'
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
exports.OllamaHTTPProvider = OllamaHTTPProvider;
function createOllamaProvider(config) {
    return new OllamaHTTPProvider(config);
}
//# sourceMappingURL=ollama.js.map