import { createSupervisorLoop, LoopConfig } from './supervisor/loop';
import { logger } from './utils/logger';

async function main() {
  const args = process.argv.slice(2);
  const config: Partial<LoopConfig> = {
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

  logger.info('Chief Wiggum starting...', { retries: 0 });

  const loop = createSupervisorLoop(config);

  process.on('SIGINT', () => {
    logger.warn('Received SIGINT, stopping...');
    loop.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.warn('Received SIGTERM, stopping...');
    loop.stop();
    process.exit(0);
  });

  try {
    await loop.start();
    logger.info('Chief Wiggum finished successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Fatal error: ${message}`);
    process.exit(1);
  }
}

main();