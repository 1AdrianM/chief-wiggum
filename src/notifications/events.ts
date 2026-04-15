import { NotificationEvent, NotificationEventType } from '../types';

export type EventHandler = (event: NotificationEvent) => void | Promise<void>;

export interface NotificationConfig {
  enabled?: boolean;
  handlers?: EventHandler[];
}

export function createEvent(type: NotificationEventType, payload: Record<string, unknown> = {}): NotificationEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    payload
  };
}