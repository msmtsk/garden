#!/usr/bin/env node
/**
 * Copies scripts/pre-commit → .git/hooks/pre-commit and makes it executable.
 * Runs automatically after `npm install` (postinstall).
 */
import { copyFile, chmod, access } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = resolve(__dirname, 'pre-commit');
const dest = resolve(root, '.git', 'hooks', 'pre-commit');

try {
  await access(resolve(root, '.git'));
} catch {
  console.log('setup-hooks: no .git directory found, skipping.');
  process.exit(0);
}

await copyFile(src, dest);
await chmod(dest, 0o755);
console.log('✅ Git pre-commit hook installed.');
