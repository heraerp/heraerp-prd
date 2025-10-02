#!/usr/bin/env ts-node

/**
 * Re-uses your snapshot generator to write to snapshots/current for CI comparison.
 * Assumes your existing generator exports a function or we shell out with an env flag.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUT_DIR = 'snapshots/current';
fs.mkdirSync(OUT_DIR, { recursive: true });

// If your snapshot generator supports an env var or CLI arg, use it.
// Example (adapt to your script):
process.env.SNAPSHOT_OUTPUT_DIR = OUT_DIR;
execSync(`tsx scripts/generate-preset-snapshots.ts`, {
  stdio: 'inherit',
});