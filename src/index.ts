import { createLoopEngine } from './loop/loopEngine';
import { createServerProvider, createOpenCodeProvider } from './providers/opencode.provider';
import { LoopConfig, ExecutionMode } from './types';
import { logger } from './utils/logger';
import { initialize } from './state/init';

async function main() {
  initialize();
  
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
      initialize();
      console.log('Chief Wiggum initialized successfully');
      break;
    case '--help':
    case '-h':
      printUsage();
      break;
    default:
      logger.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

function printUsage(): void {
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

async function handleRun(subArgs: string[]): Promise<void> {
  const providerType = subArgs[0];
  
  if (!providerType) {
    logger.error('Provider required. Use: chief run opencode');
    process.exit(1);
  }

  const config = parseConfig(subArgs.slice(1));

  let provider;
  let shouldStartServer = config.server || false;
  const serverPort = config.port || 8080;

  if (providerType === 'opencode') {
    if (shouldStartServer) {
      logger.info(`Starting OpenCode server on port ${serverPort}...`);
      provider = createServerProvider(`http://localhost:${serverPort}`);
      await (provider as any).startServer();
      logger.info('OpenCode server started');
    } else {
      provider = createOpenCodeProvider(`http://localhost:${serverPort}`, false);
    }
  } else {
    logger.error(`Unknown provider: ${providerType}`);
    process.exit(1);
  }

  logger.info(`Chief Wiggum starting in ${config.executionMode} mode...`);

  const loop = createLoopEngine({
    ...config,
    verifyCommand: config.verifyCommand || 'npm run build',
    workdir: config.workdir,
    maxIterations: config.maxIterations,
    executionMode: config.executionMode
  });

  process.on('SIGINT', async () => {
    logger.warn('Received SIGINT, stopping...');
    if (shouldStartServer) {
      (provider as any).stopServer();
    }
    loop.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.warn('Received SIGTERM, stopping...');
    if (shouldStartServer) {
      (provider as any).stopServer();
    }
    loop.stop();
    process.exit(0);
  });

  try {
    const success = await loop.start();
    if (success) {
      logger.info('Chief Wiggum finished successfully');
      process.exit(0);
    } else {
      logger.error('Chief Wiggum finished with failures');
      process.exit(1);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Fatal error: ${message}`);
    process.exit(1);
  } finally {
    if (shouldStartServer) {
      (provider as any).stopServer();
    }
  }
}

interface Config extends Partial<LoopConfig> {
  server?: boolean;
  port?: number;
}

function parseConfig(args: string[]): Config {
  const config: Config = {
    executionMode: 'build'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--mode':
        config.executionMode = args[++i] as ExecutionMode;
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