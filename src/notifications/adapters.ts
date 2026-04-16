import { NotificationEvent } from '../types';

export interface NotificationAdapter {
  name: string;
  send(event: NotificationEvent): Promise<boolean>;
  isEnabled(): boolean;
}

export interface AdapterConfig {
  enabled?: boolean;
  priority?: number;
}

export class EmailAdapter implements NotificationAdapter {
  public readonly name = 'email';
  private config: EmailConfig;
  private enabled: boolean = false;

  constructor(config: EmailConfig = {}) {
    this.config = {
      host: config.host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: config.port || parseInt(process.env.SMTP_PORT || '587'),
      secure: config.secure || false,
      user: config.user || process.env.SMTP_USER || '',
      password: config.password || process.env.SMTP_PASSWORD || '',
      from: config.from || process.env.SMTP_FROM || 'chief-wiggum@local',
      to: config.to || process.env.SMTP_TO || ''
    };
    this.enabled = !!(this.config.user && this.config.to);
  }

  async send(event: NotificationEvent): Promise<boolean> {
    if (!this.isEnabled()) {
      console.log(`[Email] Adapter disabled, skipping`);
      return false;
    }

    const subject = this.getSubject(event);
    const body = this.formatBody(event);

    try {
      let nodemailer;
      try {
        nodemailer = await import('nodemailer');
      } catch {
        console.log(`[Email] nodemailer not installed, skipping`);
        return false;
      }
      
      const transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.password
        }
      });

      await transporter.sendMail({
        from: this.config.from,
        to: this.config.to,
        subject: subject,
        text: body
      });

      console.log(`[Email] Sent: ${subject}`);
      return true;
    } catch (err) {
      console.error(`[Email] Failed to send: ${err}`);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private getSubject(event: NotificationEvent): string {
    const prefixes: Record<string, string> = {
      task_started: '🚀 Task Started',
      task_completed: '✅ Task Completed',
      task_failed: '❌ Task Failed',
      loop_stuck: '⚠️ Loop Stuck',
      fallback_triggered: '🔄 Fallback Triggered'
    };
    return `Chief Wiggum: ${prefixes[event.type] || event.type}`;
  }

  private formatBody(event: NotificationEvent): string {
    const lines = [
      `Event: ${event.type}`,
      `Time: ${event.timestamp}`,
      '',
      'Payload:'
    ];

    for (const [key, value] of Object.entries(event.payload)) {
      lines.push(`  ${key}: ${value}`);
    }

    return lines.join('\n');
  }
}

export interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  password?: string;
  from?: string;
  to?: string;
}

export class ConsoleAdapter implements NotificationAdapter {
  public readonly name = 'console';
  
  async send(event: NotificationEvent): Promise<boolean> {
    const color = this.getColor(event.type);
    console.log(`${color}[NOTIFY] ${event.type}:`, event.payload);
    return true;
  }

  isEnabled(): boolean {
    return true;
  }

  private getColor(type: string): string {
    const colors: Record<string, string> = {
      task_started: '\x1b[36m',
      task_completed: '\x1b[32m',
      task_failed: '\x1b[31m',
      loop_stuck: '\x1b[33m',
      fallback_triggered: '\x1b[35m'
    };
    return colors[type] || '\x1b[0m';
  }
}

export class WebhookAdapter implements NotificationAdapter {
  public readonly name = 'webhook';
  private url: string;
  private enabled: boolean = false;

  constructor(url?: string) {
    this.url = url || process.env.WEBHOOK_URL || '';
    this.enabled = !!this.url;
  }

  async send(event: NotificationEvent): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      return response.ok;
    } catch (err) {
      console.error(`[Webhook] Failed: ${err}`);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export function createEmailAdapter(config?: EmailConfig): NotificationAdapter {
  return new EmailAdapter(config);
}

export function createConsoleAdapter(): NotificationAdapter {
  return new ConsoleAdapter();
}

export function createWebhookAdapter(url?: string): NotificationAdapter {
  return new WebhookAdapter(url);
}