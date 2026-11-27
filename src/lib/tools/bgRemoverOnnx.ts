// Eduvelto — AI Background Remover engine (ONNX version, landed 27 Nov 2026, A-tools).
//
// Loader + pre/post-processing ONLY. onnxruntime-web loads via dynamic
// import() inside loadBgModel (never a static import, never in the main
// bundle). The model file itself is a HOSTED ASSET, never bundled and
// never committed as a binary — served from /models/<name>.onnx.
//
// MODEL DECISION — FLAGGED FOR OWNER CONFIRMATION (spec-07):
// default below is a MODNet-class small model (~25 MB) at 320x320 input.
// Alternatives: quantised U2Net (~40 MB), U2Net/ISNet/RMBG-1.4 (~170 MB).
// Do NOT swap the model URL / inputSize / mean / std independently —
// wrong normalisation silently wrecks mask quality. No model file is
// shipped in this landing: /models/bg-remover-v1.onnx does not exist
// yet, so loadBgModel fails honestly today and the UI offers the
// simple solid-colour remover on the same page (spec-07 fallback).
// HD output sits behind the 30 s Rewarded Ad per the standing rule;
// AdSense is still in review, so the HD unlock stays DISABLED with
// honest copy until approval — standard-resolution output is free.

export type BgModelStatus = 'not-loaded' | 'loading' | 'ready' | 'failed';

export interface ModelProgress {
  loadedBytes: number;
  totalBytes: number | null;
}

/** Model + runtime constants — change together, never one without the other. */
export const BG_ONNX_CONFIG = {
  /** Hosted asset URL (versioned filename). NOT SHIPPED YET — owner to confirm the model. */
  modelUrl: '/models/bg-remover-v1.onnx',
  /** Recommended default: MODNet-class small model (~25 MB). Owner confirms. */
  modelName: 'MODNet-class small model (recommended default, ~25 MB)',
  /** Expected model input size (square). Set from the chosen model. */
  inputSize: 320,
  /** Normalisation for the chosen model (ImageNet mean/std). */
  mean: [0.485, 0.456, 0.406],
  std: [0.229, 0.224, 0.225],
  /** Max input dimension (long edge) for phase 1. */
  maxInputEdgePx: 2048,
  /** Load timeout: after this, show the honest fallback (simple remover). */
  loadTimeoutMs: 60_000,
};

/** Module-level session cache: the model downloads once per page load. */
let cachedSession: unknown = null;

/**
 * Load onnxruntime-web (dynamic import only) + the model, with progress.
 * Fetches the model with a progress reader (NOT the session call), then
 * creates the session from the downloaded bytes. Throws on timeout /
 * 404 / no-WebAssembly. The UI MUST catch the throw and offer the
 * simple remover on the same page. Never a spinner that never ends.
 */
export async function loadBgModel(onProgress: (p: ModelProgress) => void): Promise<void> {
  if (cachedSession) return;
  if (typeof WebAssembly === 'undefined') {
    throw new Error('This browser cannot run the AI model (WebAssembly is unavailable) — use the simple remover instead');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BG_ONNX_CONFIG.loadTimeoutMs);
  let modelBytes: ArrayBuffer;
  try {
    const response = await fetch(BG_ONNX_CONFIG.modelUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(
        `The AI model file is not available yet (HTTP ${response.status} for ${BG_ONNX_CONFIG.modelUrl}) — the model choice is still awaiting confirmation, so use the simple remover on this page for now`,
      );
    }
    const total = response.headers.get('content-length');
    const totalBytes = total ? Number(total) : null;
    if (!response.body) {
      modelBytes = await response.arrayBuffer();
    } else {
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          onProgress({ loadedBytes: loaded, totalBytes });
        }
      }
      const merged = new Uint8Array(loaded);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      modelBytes = merged.buffer as ArrayBuffer;
    }
    onProgress({ loadedBytes: modelBytes.byteLength, totalBytes: totalBytes ?? modelBytes.byteLength });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('The AI model took too long to download (60 s) — use the simple remover on this page for now');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
  // onnxruntime-web loads lazily here only; its .wasm files resolve
  // relative to the bundled chunk by default. If the deploy serves the
  // wasm files from a different path, set ort.env.wasm.wasmPaths first
  // (see the deploy checklist in the landing report).
  const ort = await import('onnxruntime-web');
  try {
    cachedSession = await ort.InferenceSession.create(modelBytes, {
      executionProviders: ['wasm'],
    });
  } catch {
    throw new Error('The AI model could not start in this browser — use the simple remover on this page for now');
  }
}

/** Downscale helper: keep aspect ratio, cap the long edge. Pure math. */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height };
  const scale = maxEdge / longEdge;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Apply a model mask (0-255 per pixel) to image alpha, with a threshold and
 * feathering. mask.length must equal w*h. Pure pixel math (no DOM).
 * threshold: mask values below this become transparent (default 128).
 * featherPx: box-blur radius on the mask edge (default 1).
 */
export function applyMaskToImage(
  image: { data: Uint8ClampedArray; width: number; height: number },
  mask: Uint8ClampedArray,
  threshold = 128,
  featherPx = 1,
): void {
  const { data, width, height } = image;
  if (mask.length !== width * height) {
    throw new Error(`Mask size (${mask.length}) does not match the image (${width}x${height})`);
  }
  const soft = featherMask(mask, width, height, featherPx);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4 + 3] = soft[i] < threshold ? 0 : soft[i];
  }
}

/** Cheap box blur on a single-channel mask (2 passes, radius px). */
export function featherMask(mask: Uint8ClampedArray, w: number, h: number, radius: number): Uint8ClampedArray {
  if (radius <= 0) return mask;
  const out = new Uint8ClampedArray(mask);
  const tmp = new Uint8ClampedArray(mask);
  const blurPass = (src: Uint8ClampedArray, dst: Uint8ClampedArray, horizontal: boolean) => {
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        let sum = 0;
        let count = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const nx = horizontal ? x + k : x;
          const ny = horizontal ? y : y + k;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            sum += src[ny * w + nx];
            count += 1;
          }
        }
        dst[y * w + x] = Math.round(sum / count);
      }
    }
  };
  blurPass(out, tmp, true);
  blurPass(tmp, out, false);
  return out;
}

/**
 * Run the loaded model on a canvas and return a new canvas with the
 * background removed (transparent PNG-ready). Requires loadBgModel()
 * first. The model sees a 320x320 (inputSize) square; its mask is
 * resized back to the original size, then applied with threshold +
 * feathering. All image bytes stay in the browser.
 */
export async function removeBackgroundAI(
  source: HTMLCanvasElement,
  opts: { threshold?: number; featherPx?: number } = {},
): Promise<HTMLCanvasElement> {
  if (!cachedSession) {
    throw new Error('The AI model is not loaded yet — load it first');
  }
  const ort = await import('onnxruntime-web');
  const session = cachedSession as Awaited<ReturnType<typeof ort.InferenceSession.create>>;
  const size = BG_ONNX_CONFIG.inputSize;
  const small = document.createElement('canvas');
  small.width = size;
  small.height = size;
  const sctx = small.getContext('2d');
  if (!sctx) throw new Error('Canvas is unavailable in this browser');
  sctx.drawImage(source, 0, 0, size, size);
  const smallData = sctx.getImageData(0, 0, size, size).data;
  const input = new Float32Array(3 * size * size);
  const { mean, std } = BG_ONNX_CONFIG;
  for (let i = 0; i < size * size; i += 1) {
    input[i] = (smallData[i * 4] / 255 - mean[0]) / std[0];
    input[size * size + i] = (smallData[i * 4 + 1] / 255 - mean[1]) / std[1];
    input[2 * size * size + i] = (smallData[i * 4 + 2] / 255 - mean[2]) / std[2];
  }
  const tensor = new ort.Tensor('float32', input, [1, 3, size, size]);
  const inputName = session.inputNames[0];
  const feeds: Record<string, unknown> = { [inputName]: tensor };
  const results = await session.run(feeds as never);
  const outputName = session.outputNames[0];
  const output = results[outputName];
  const raw = (output.data as Float32Array | Uint8Array) ?? null;
  if (!raw || raw.length !== size * size) {
    throw new Error('The AI model returned an unexpected result — use the simple remover on this page for now');
  }
  // Normalise the mask to 0-255 (some models return 0..1 floats).
  let max = 0;
  for (let i = 0; i < raw.length; i += 1) if (raw[i] > max) max = raw[i];
  const maskSmall = new Uint8ClampedArray(size * size);
  const scale = max > 1.01 ? 1 : 255;
  for (let i = 0; i < raw.length; i += 1) maskSmall[i] = Math.round(Math.max(0, Math.min(255, raw[i] * scale)));
  // Resize the mask back to the original image size via a canvas draw.
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = size;
  maskCanvas.height = size;
  const mctx = maskCanvas.getContext('2d');
  if (!mctx) throw new Error('Canvas is unavailable in this browser');
  const maskImage = mctx.createImageData(size, size);
  for (let i = 0; i < size * size; i += 1) {
    maskImage.data[i * 4] = maskSmall[i];
    maskImage.data[i * 4 + 1] = maskSmall[i];
    maskImage.data[i * 4 + 2] = maskSmall[i];
    maskImage.data[i * 4 + 3] = 255;
  }
  mctx.putImageData(maskImage, 0, 0);
  const full = document.createElement('canvas');
  full.width = source.width;
  full.height = source.height;
  const fctx = full.getContext('2d');
  if (!fctx) throw new Error('Canvas is unavailable in this browser');
  fctx.drawImage(source, 0, 0);
  const fullData = fctx.getImageData(0, 0, full.width, full.height);
  const bigMaskCanvas = document.createElement('canvas');
  bigMaskCanvas.width = full.width;
  bigMaskCanvas.height = full.height;
  const bctx = bigMaskCanvas.getContext('2d');
  if (!bctx) throw new Error('Canvas is unavailable in this browser');
  bctx.drawImage(maskCanvas, 0, 0, full.width, full.height);
  const bigMaskData = bctx.getImageData(0, 0, full.width, full.height).data;
  const bigMask = new Uint8ClampedArray(full.width * full.height);
  for (let i = 0; i < bigMask.length; i += 1) bigMask[i] = bigMaskData[i * 4];
  applyMaskToImage(fullData, bigMask, opts.threshold ?? 128, opts.featherPx ?? 1);
  fctx.putImageData(fullData, 0, 0);
  return full;
}
