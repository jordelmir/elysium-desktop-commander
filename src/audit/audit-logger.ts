import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export interface AuditEvent {
  callId: string;
  tool: string;
  durationMs: number;
  outcome: 'success' | 'error';
  errorCode?: string;
}

export class AuditLogger {
  constructor(private readonly filePath?: string) {}

  async record(event: AuditEvent): Promise<void> {
    if (!this.filePath) return;
    await mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    await appendFile(this.filePath, `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`, { mode: 0o600 });
  }
}
