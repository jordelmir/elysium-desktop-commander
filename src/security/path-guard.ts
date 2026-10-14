import path from 'node:path';
import { realpath, stat } from 'node:fs/promises';

export class PathGuard {
  readonly roots: string[];

  constructor(roots: string[]) {
    this.roots = roots.map((root) => path.resolve(root));
  }

  async resolveExisting(candidate: string): Promise<string> {
    const resolved = path.resolve(candidate);
    const canonical = await realpath(resolved);
    if (!(await this.isInsideCanonical(canonical))) throw new Error('Path is outside the authorized roots.');
    return canonical;
  }

  async resolveChild(root: string, relativePath = '.'): Promise<string> {
    const canonicalRoot = await this.resolveExisting(root);
    const requested = path.resolve(canonicalRoot, relativePath);
    const canonical = await realpath(requested);
    if (!(await this.isInsideCanonical(canonical)) || !(await this.isInsideCanonical(canonicalRoot))) {
      throw new Error('Path is outside the authorized roots.');
    }
    return canonical;
  }

  async assertRegularFile(candidate: string): Promise<string> {
    const canonical = await this.resolveExisting(candidate);
    const info = await stat(canonical);
    if (!info.isFile()) throw new Error('Path is not a regular file.');
    return canonical;
  }

  isInside(candidate: string): boolean {
    return this.roots.some((root) => candidate === root || candidate.startsWith(`${root}${path.sep}`));
  }

  private async isInsideCanonical(candidate: string): Promise<boolean> {
    const canonicalRoots = await Promise.all(this.roots.map((root) => realpath(root).catch(() => root)));
    return canonicalRoots.some((root) => candidate === root || candidate.startsWith(`${root}${path.sep}`));
  }
}
