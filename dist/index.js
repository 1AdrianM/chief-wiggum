"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loopEngine_1 = require("./loop/loopEngine");
const opencode_provider_1 = require("./providers/opencode.provider");
const logger_1 = require("./utils/logger");
const init_1 = require("./state/init");
async function main() {
    (0, init_1.initialize)();
    const args = process.argv.slice(2);
    if (args.length === 0) {
        printUsage();
        process.exit(1);
    }
    const command = args[0];
    switch (command) {
        case 'run':
            await handleRun(args.slice(1));
            break;
        case 'init':
            (0, init_1.initialize)();
            console.log('Chief Wiggum initialized successfully');
            break;
        case '--help':
        case '-h':
            printUsage();
            break;
        default:
            logger_1.logger.error(`Unknown command: ${command}`);
            printUsage();
            process.exit(1);
    }
}
function printUsage() {
    console.log(`
Chief Wiggum Harness

Usage:
  chief run <provider> [options]
  chief init
  chief --help

Commands:
  run <provider>   Run the agent loop with specified provider
                   Supported: opencode
  init             Initialize Chief Wiggum environment (scaffold)

Options:
  --mode <mode>   Execution mode: plan, build, debug
  --verify <cmd>  Verification command
  --workdir <dir> Working directory
  --max-iterations <n> Max iterations
  --server        Start provider as server first
  --port <n>      Server port (default: 8080)

Examples:
  chief run opencode
  chief run opencode --mode debug
  chief run opencode --server --port 8080
  chief run opencode --verify "npm test"
`);
}
async function handleRun(subArgs) {
    const providerType = subArgs[0];
    if (!providerType) {
        logger_1.logger.error('Provider required. Use: chief run opencode');
        process.exit(1);
    }
    const config = parseConfig(subArgs.slice(1));
    let provider;
    let shouldStartServer = config.server || false;
    const serverPort = config.port || 8080;
    if (providerType === 'opencode') {
        if (shouldStartServer) {
            logger_1.logger.info(`Starting OpenCode server on port ${serverPort}...`);
            provider = (0, opencode_provider_1.createServerProvider)(`http://localhost:${serverPort}`);
            await provider.startServer();
            logger_1.logger.info('OpenCode server started');
        }
        else {
            provider = (0, opencode_provider_1.createOpenCodeProvider)(`http://localhost:${serverPort}`, false);
        }
    }
    else {
        logger_1.logger.error(`Unknown provider: ${providerType}`);
        process.exit(1);
    }
    logger_1.logger.info(`Chief Wiggum starting in ${config.executionMode} mode...`);
    const loop = (0, loopEngine_1.createLoopEngine)({
        ...config,
        verifyCommand: config.verifyCommand || 'npm run build',
        workdir: config.workdir,
        maxIterations: config.maxIterations,
        executionMode: config.executionMode
    });
    process.on('SIGINT', async () => {
        logger_1.logger.warn('Received SIGINT, stopping...');
        if (shouldStartServer) {
            provider.stopServer();
        }
        loop.stop();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        logger_1.logger.warn('Received SIGTERM, stopping...');
        if (shouldStartServer) {
            provider.stopServer();
        }
        loop.stop();
        process.exit(0);
    });
    try {
        const success = await loop.start();
        if (success) {
            logger_1.logger.info('Chief Wiggum finished successfully');
            process.exit(0);
        }
        else {
            logger_1.logger.error('Chief Wiggum finished with failures');
            process.exit(1);
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger_1.logger.error(`Fatal error: ${message}`);
        process.exit(1);
    }
    finally {
        if (shouldStartServer) {
            provider.stopServer();
        }
    }
}
function parseConfig(args) {
    const config = {
        executionMode: 'build'
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--mode':
                config.executionMode = args[++i];
                break;
            case '--verify':
                config.verifyCommand = args[++i];
                break;
            case '--workdir':
                config.workdir = args[++i];
                break;
            case '--max-iterations':
                config.maxIterations = parseInt(args[++i], 10);
                break;
            case '--server':
                config.server = true;
                break;
            case '--port':
                config.port = parseInt(args[++i], 10);
                break;
        }
    }
    return config;
}
main();
//# sourceMappingURL=index.js.map