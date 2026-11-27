// Background Remover — wasm fix regression tests (27 Nov 2026, landing/wasm).
//
// The Cloudflare Pages deploy failed twice because the full
// 'onnxruntime-web' bundle emits the 29.5 MB jsep wasm into dist/,
// over the Pages 25 MiB single-asset limit. The loader now imports
// the 'onnxruntime-web/wasm' subpath (wasm backend only, 14.8 MB
// plain threaded wasm). These tests pin the behaviour that must hold
// whatever the wasm does:
//   1. the simple canvas remover (the LIVE path) still works;
//   2. the ONNX loader still fails honestly when the model is missing
//      (there is no model file yet) and points at the simple remover;
//   3. the wasm-subpath module loads and exposes a wasm session API;
//   4. the dist-size guard fails on an oversized file and passes
//      at/under the limit.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { closeSync, ftruncateSync, mkdtempSync, openSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { removeBackgroundPixels } from '../../tools/backgroundRemover';
import { loadBgModel, removeBackgroundAI } from '../../tools/bgRemoverOnnx';

const GUARD_SCRIPT = fileURLToPath(
  new URL('../../../../scripts/check-dist-size.mjs', import.meta.url),
);
const PAGES_LIMIT_BYTES = 25 * 1024 * 1024;

describe('simple canvas remover (live path)', () => {
  it('removes a white background pixel, keeps a black pixel', () => {
    const data = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
    const out = removeBackgroundPixels(data, 2, 1, { r: 255, g: 255, b: 255 }, 10);
    expect([...out]).toEqual([255, 255, 255, 0, 0, 0, 0, 255]);
  });
});

describe('ONNX loader honest fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fails honestly when the model file is missing (HTTP 404) and points at the simple remover', async () => {
    vi.stubGlobal(
      'fetch',
      async () => ({ ok: false, status: 404 }) as unknown as Response,
    );
    await expect(loadBgModel(() => {})).rejects.toThrow(
      /not available yet.*404.*simple remover/s,
    );
  });

  it('refuses to run the AI remover before a model is loaded', async () => {
    const canvas = { width: 2, height: 2 } as HTMLCanvasElement;
    await expect(removeBackgroundAI(canvas)).rejects.toThrow(/not loaded yet/);
  });
});

describe('onnxruntime-web/wasm subpath', () => {
  it('loads the wasm-backend-only bundle and exposes a session API', async () => {
    const ort = await import('onnxruntime-web/wasm');
    expect(typeof ort.InferenceSession.create).toBe('function');
    expect(ort.env.wasm).toBeDefined();
    // The wasm backend is the only execution provider the loader asks
    // for — no webgpu/jsep provider is involved in this bundle.
    expect(typeof ort.Tensor).toBe('function');
  });
});

describe('dist-size guard (scripts/check-dist-size.mjs)', () => {
  let dir: string;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  function runGuard(target: string): { status: number | null; output: string } {
    try {
      const stdout = execFileSync('node', [GUARD_SCRIPT, target], { encoding: 'utf8' });
      return { status: 0, output: stdout };
    } catch (err) {
      const e = err as { status: number | null; stdout: string; stderr: string };
      return { status: e.status, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
    }
  }

  function sparseFile(name: string, size: number): void {
    const fd = openSync(join(dir, name), 'w');
    try {
      ftruncateSync(fd, size);
    } finally {
      closeSync(fd);
    }
  }

  it('fails (exit 1) when a file exceeds the 25 MiB limit and names it', () => {
    dir = mkdtempSync(join(tmpdir(), 'dist-guard-over-'));
    sparseFile('ort-wasm-simd-threaded.jsep.wasm', PAGES_LIMIT_BYTES + 1);
    const result = runGuard(dir);
    expect(result.status).toBe(1);
    expect(result.output).toMatch(/ort-wasm-simd-threaded\.jsep\.wasm/);
    expect(result.output).toMatch(/25 MiB/);
  });

  it('passes (exit 0) for a file exactly at the 25 MiB limit', () => {
    dir = mkdtempSync(join(tmpdir(), 'dist-guard-at-'));
    sparseFile('exactly-at-limit.wasm', PAGES_LIMIT_BYTES);
    const result = runGuard(dir);
    expect(result.status).toBe(0);
    expect(result.output).toMatch(/OK/);
  });

  it('passes (exit 0) for a directory of small files', () => {
    dir = mkdtempSync(join(tmpdir(), 'dist-guard-small-'));
    writeFileSync(join(dir, 'index.html'), '<html></html>');
    sparseFile('chunk.js', 1024);
    const result = runGuard(dir);
    expect(result.status).toBe(0);
    expect(result.output).toMatch(/OK/);
  });
});
