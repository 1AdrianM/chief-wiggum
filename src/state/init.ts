import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const STATE_TEMPLATE = {
  currentTask: 1,
  tasks: [],
  retries: 0,
  lastError: null,
  lastErrorHash: null
};

export function ensureStateFile(statePath: string = 'state.json'): boolean {
  if (fs.existsSync(statePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (data.currentTask !== undefined && data.tasks !== undefined) {
        logger.debug(`State file found at ${statePath}`);
        return true;
      }
    } catch {
      logger.warn(`Invalid state file at ${statePath}, creating backup and new one`);
    }
    
    const backupPath = statePath + '.backup.' + Date.now();
    fs.copyFileSync(statePath, backupPath);
    logger.info(`Backed up invalid state to ${backupPath}`);
  }
  
  fs.writeFileSync(statePath, JSON.stringify(STATE_TEMPLATE, null, 2));
  logger.info(`Created new state file at ${statePath}`);
  return true;
}

export function ensureAuditFile(auditPath: string = 'audit.log'): boolean {
  if (!fs.existsSync(auditPath)) {
    fs.writeFileSync(auditPath, '');
    logger.info(`Created new audit log at ${auditPath}`);
  } else {
    logger.debug(`Audit log found at ${auditPath}`);
  }
  return true;
}

export function ensureConfigDir(configPath: string = '.chief-wiggum'): boolean {
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(configPath, { recursive: true });
    logger.info(`Created config directory at ${configPath}`);
    
    const configFile = path.join(configPath, 'config.json');
    fs.writeFileSync(configFile, JSON.stringify({
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      providers: {
        default: 'opencode',
        available: ['opencode', 'ollama']
      }
    }, null, 2));
  }
  return true;
}

export function initialize(): boolean {
  logger.info('Initializing Chief Wiggum environment...');
  
  try {
    ensureStateFile();
    ensureAuditFile();
    ensureConfigDir();
    
    logger.info('Chief Wiggum initialized successfully');
    return true;
  } catch (err) {
    logger.error(`Initialization failed: ${err}`);
    return false;
  }
}

export function getConfig(configPath: string = '.chief-wiggum/config.json'): Record<string, unknown> | null {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch {
    return null;
  }
  return null;
}