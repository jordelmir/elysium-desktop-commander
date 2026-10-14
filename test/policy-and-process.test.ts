import { describe, expect, it } from 'vitest';
import { assertReadOnly } from '../src/security/policy.js';
import { isCommandAllowed, SessionManager } from '../src/sessions/session-manager.js';

describe('READ_ONLY policy', () => {
  it('permits read-only tools and blocks mutations', () => {
    expect(() => assertReadOnly('read_file')).not.toThrow();
    expect(() => assertReadOnly('terminate_process')).toThrow('disabled');
  });

  it('blocks shell and unlisted executables', () => {
    expect(isCommandAllowed('sh', ['-c', 'echo unsafe'])).toBe(false);
    expect(isCommandAllowed('node', ['-e', 'process.exit(0)'])).toBe(false);
    expect(isCommandAllowed('ls', ['/etc'])).toBe(false);
    expect(isCommandAllowed('git', ['status'])).toBe(true);
    expect(isCommandAllowed('git', ['status', '--short'])).toBe(false);
  });

  it('runs a real harmless process and captures its output', async () => {
    const manager = new SessionManager();
    const session = manager.start({ executable: '/bin/pwd', args: [], cwd: process.cwd(), timeoutMs: 2_000 });
    const result = await manager.wait(session.id, 300);
    expect(result.output.trim()).toBe(process.cwd());
    expect(result.status).toBe('exited');
    expect(result.exitCode).toBe(0);
  });

  it('terminates a test process at its deadline and reports timeout', async () => {
    const manager = new SessionManager();
    const session = manager.start({ executable: 'sleep', args: ['2'], cwd: process.cwd(), timeoutMs: 100 });
    const result = await manager.wait(session.id, 200);
    expect(result.status).toBe('timed_out');
  });
});
