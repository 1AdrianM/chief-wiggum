import { NotificationEvent, NotificationEventType } from '../types';
import { EventHandler, createEvent } from './events';
import { logger } from '../utils/logger';

export class NotificationDispatcher {
  private handlers: Map<NotificationEventType, EventHandler[]> = new Map();
  private globalHandlers: EventHandler[] = [];

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

  clear(): void {
    this.handlers.clear();
    this.globalHandlers = [];
  }

  removeHandler(eventType: NotificationEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }
}

export const dispatcher = new NotificationDispatcher();

export function createDispatcher(): NotificationDispatcher {
  return new NotificationDispatcher();
}