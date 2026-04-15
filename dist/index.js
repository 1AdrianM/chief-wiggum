"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loop_1 = require("./supervisor/loop");
const logger_1 = require("./utils/logger");
async function main() {
    const args = process.argv.slice(2);
    const config = {
        verifyCommand: args.includes('--verify')
            ? args[args.indexOf('--verify') + 1] || 'npm run build'
            : 'npm run build',
        workdir: args.includes('--workdir')
            ? args[args.indexOf('--workdir') + 1]
            : undefined,
        maxIterations: args.includes('--max-iterations')
            ? parseInt(args[args.indexOf('--max-iterations') + 1] || '100', 10)
            : 100
    };
    logger_1.logger.info('Chief Wiggum starting...', { retries: 0 });
    const loop = (0, loop_1.createSupervisorLoop)(config);
    process.on('SIGINT', () => {
        logger_1.logger.warn('Received SIGINT, stopping...');
        loop.stop();
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        logger_1.logger.warn('Received SIGTERM, stopping...');
        loop.stop();
        process.exit(0);
    });
    try {
        await loop.start();
        logger_1.logger.info('Chief Wiggum finished successfully');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger_1.logger.error(`Fatal error: ${message}`);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map