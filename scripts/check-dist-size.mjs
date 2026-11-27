#!/usr/bin/env node
// Build guard (27 Nov 2026, landing/wasm): Cloudflare Pages rejects any
// single site asset over 25 MiB on ALL plans
// (developers.cloudflare.com/pages/platform/limits/ — "The maximum file
// size for a single Cloudflare Pages site asset is 25 MiB"). A local
// build passes while the deploy fails, and Pages keeps serving the
// previous deployment — so an oversized asset silently leaves the live
// site stale. That is exactly what happened twice on 27 Nov 2026: the
// 29.5 MB onnxruntime-web jsep wasm (ort-wasm-simd-threaded.jsep.wasm)
// was emitted into dist/ and both Pages builds failed.
//
// This script FAILS THE BUILD LOUDLY when any file in dist/ exceeds
// the limit. It runs as `postbuild` (see package.json) so `npm run
// build` can never produce an undeployable dist/, and again at the end
// of `build:pages`, after prerender writes its HTML into dist/.
//
// Usage: node scripts/check-dist-size.mjs [dir] [--limit-mib N]
//   dir defaults to 'dist' (relative to the current working directory).
//   --limit-mib overrides the 25 MiB limit (tests only — never use a
//   higher limit for a real build; Pages will still reject the file).
import { readdir, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Cloudflare Pages maximum size for a single site asset, in bytes. */
export const PAGES_MAX_ASSET_BYTES = 25 * 1024 * 1024;

/**
 * Walk `dir` recursively and return every file over `limitBytes`,
 * largest first: [{ path, size }]. `path` is relative to `dir`.
 */
export async function findOversizedAssets(dir, limitBytes = PAGES_MAX_ASSET_BYTES) {
  const oversized = [];
  const walk = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const { size } = await stat(full);
        if (size > limitBytes) {
          oversized.push({ path: relative(dir, full), size });
        }
      }
    }
  };
  await walk(resolve(dir));
  oversized.sort((a, b) => b.size - a.size);
  return oversized;
}

/**
 * Scan `dir` and return { oversized, largest, total } where `largest`
 * is the biggest file found ({ path, size } | null) and `total` is the
 * file count. A file exactly at the limit is allowed — only files
 * OVER 25 MiB fail, matching the Pages rule.
 */
export async function checkDistSize(dir, limitBytes = PAGES_MAX_ASSET_BYTES) {
  let largest = null;
  let total = 0;
  const walk = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const { size } = await stat(full);
        total += 1;
        if (!largest || size > largest.size) {
          largest = { path: relative(dir, full), size };
        }
      }
    }
  };
  await walk(resolve(dir));
  const oversized = await findOversizedAssets(dir, limitBytes);
  return { oversized, largest, total };
}

function formatMiB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

// CLI entry point. Importing this module from a test must NOT run the
// check — only run when executed directly.
const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith('--')) ?? 'dist';
  const limitArg = args.find((a) => a.startsWith('--limit-mib='));
  const limitBytes = limitArg
    ? Number(limitArg.split('=')[1]) * 1024 * 1024
    : PAGES_MAX_ASSET_BYTES;
  if (!Number.isFinite(limitBytes) || limitBytes <= 0) {
    console.error('check-dist-size: --limit-mib must be a positive number');
    process.exitCode = 2;
  } else {
    let result;
    try {
      result = await checkDistSize(dir, limitBytes);
    } catch (err) {
      console.error(`check-dist-size: cannot scan ${dir}: ${err.message}`);
      process.exitCode = 2;
    }
    if (result) {
      if (result.oversized.length > 0) {
        console.error(
          `check-dist-size: FAILED — ${result.oversized.length} file(s) in ${dir} exceed the Cloudflare Pages 25 MiB single-asset limit:`,
        );
        for (const file of result.oversized) {
          console.error(`  ${file.path} — ${formatMiB(file.size)}`);
        }
        console.error(
          'Move oversized assets to R2 (or exclude them from the build) — Pages will reject this deployment.',
        );
        process.exitCode = 1;
      } else {
        console.log(
          `check-dist-size: OK — ${result.total} files in ${dir}, none over ${formatMiB(limitBytes)}` +
            (result.largest
              ? ` (largest: ${result.largest.path} — ${formatMiB(result.largest.size)})`
              : ''),
        );
      }
    }
  }
}
