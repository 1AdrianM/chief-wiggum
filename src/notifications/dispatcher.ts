import { NotificationEvent, NotificationEventType } from '../types';
import { EventHandler, createEvent } from './events';
import { logger } from '../utils/logger';
import { NotificationAdapter, createEmailAdapter, createConsoleAdapter, createWebhookAdapter } from './adapters';

export class NotificationDispatcher {
  private handlers: Map<NotificationEventType, EventHandler[]> = new Map();
  private globalHandlers: EventHandler[] = [];
  private adapters: NotificationAdapter[] = [];

  constructor() {
    this.adapters.push(createConsoleAdapter());
  }

  addAdapter(adapter: NotificationAdapter): void {
    this.adapters.push(adapter);
    logger.debug(`Added notification adapter: ${adapter.name}`);
  }

  addDefaultAdapters(): void {
    const emailAdapter = createEmailAdapter();
    if (emailAdapter.isEnabled()) {
      this.adapters.push(emailAdapter);
      logger.info('Email notification adapter enabled');
    }

    const webhookAdapter = createWebhookAdapter();
    if (webhookAdapter.isEnabled()) {
      this.adapters.push(webhookAdapter);
      logger.info('Webhook notification adapter enabled');
    }
  }

  on(eventType: NotificationEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  onAny(handler: EventHandler): void {
    this.globalHandlers.push(handler);
  }

  emit(type: NotificationEventType, payload: Record<string, unknown> = {}): void {
    const event = createEvent(type, payload);
    this.dispatch(event);
    this.sendViaAdapters(event);
  }

  private dispatch(event: NotificationEvent): void {
    for (const handler of this.globalHandlers) {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          result.catch(err => logger.error(`Handler error: ${err}`));
        }
      } catch (err) {
        logger.error(`Handler error: ${err}`);
      }
    }

    const specificHandlers = this.handlers.get(event.type) || [];
    for (const handler of specificHandlers) {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          result.catch(err => logger.error(`Handler error: ${err}`));
        }
      } catch (err) {
        logger.error(`Handler error: ${err}`);
      }
    }
  }

  private async sendViaAdapters(event: NotificationEvent): Promise<void> {
    for (const adapter of this.adapters) {
      if (!adapter.isEnabled()) continue;
      
      try {
        await adapter.send(event);
      } catch (err) {
        logger.error(`Adapter ${adapter.name} error: ${err}`);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
    this.globalHandlers = [];
    this.adapters = [createConsoleAdapter()];
  }

  removeHandler(eventType: NotificationEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  listAdapters(): string[] {
    return this.adapters.map(a => a.name);
  }
}

export const dispatcher = new NotificationDispatcher();

export function createDispatcher(): NotificationDispatcher {
  return new NotificationDispatcher();
}