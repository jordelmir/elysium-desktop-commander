import { mkdtemp, mkdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PathGuard } from '../src/security/path-guard.js';

describe('PathGuard', () => {
  let temp: string;
  let root: string;
  let outside: string;
  let guard: PathGuard;

  beforeEach(async () => {
    temp = await mkdtemp(path.join(os.tmpdir(), 'elysium-guard-'));
    root = path.join(temp, 'allowed');
    outside = path.join(temp, 'outside');
    await mkdir(root);
    await mkdir(outside);
    await writeFile(path.join(root, 'inside.txt'), 'ok');
    await writeFile(path.join(outside, 'private.txt'), 'private');
    guard = new PathGuard([root]);
  });

  afterEach(async () => rm(temp, { recursive: true, force: true }));

  it('accepts a file beneath an authorized root', async () => {
    expect(await guard.assertRegularFile(path.join(root, 'inside.txt'))).toBe(await realpath(path.join(root, 'inside.txt')));
  });

  it('rejects traversal outside authorized roots', async () => {
    await expect(guard.resolveExisting(path.join(root, '..', 'outside', 'private.txt'))).rejects.toThrow('outside');
  });

  it('rejects symlinks that resolve outside an authorized root', async () => {
    await symlink(path.join(outside, 'private.txt'), path.join(root, 'escape.txt'));
    await expect(guard.resolveExisting(path.join(root, 'escape.txt'))).rejects.toThrow('outside');
  });
});
