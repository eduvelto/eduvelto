/**
 * PDF Password Protector — real AES-256 encryption via QPDF in
 * WebAssembly (`@neslinesli93/qpdf-wasm` 0.3.1, ISC licence; QPDF
 * itself is Apache-2.0).
 *
 * Why QPDF: the PDF library used elsewhere here (pdf-lib) CANNOT
 * encrypt PDFs at all, so a "protected" download from it would open
 * without any password — a fake. QPDF is the standard C++ PDF tool
 * (qpdf.org), compiled to WebAssembly, and its `--encrypt` command
 * writes a genuinely encrypted file.
 *
 * Verified 27 Nov 2026 (Node, real qpdf-wasm 0.3.1 + a real PDF):
 * `--encrypt user owner 256` exits 0; `qpdf --check` on the output
 * exits 2 with no password and with a wrong password, and 0 with the
 * right user password and with the right owner password;
 * `--show-encryption` reports AESv3 (AES-256). The same checks run
 * in the vitest suite below, so a regression cannot silently ship
 * an unprotected file.
 *
 * The WASM module is loaded with a dynamic `import()` INSIDE the
 * functions only (never a static import), so it is lazy-loaded when
 * the user protects a file. All processing is 100% in the browser:
 * the file never leaves the device.
 *
 * Pure functions (apart from the lazy library load): no network, no
 * storage. The Emscripten virtual filesystem is used only inside one
 * call, with unique file names, and cleaned up afterwards.
 */

export const PDF_PROTECT_MIN_PASSWORD = 4;
export const PDF_PROTECT_MAX_MB = 10;

/** QPDF command exit codes: 0 = success, 2 = error (incl. bad password). */
const QPDF_EXIT_OK = 0;

/** Minimal Emscripten FS surface we use (the package's own .d.ts
 *  only declares mkdir/mount/unmount/readFile). */
interface QpdfFs {
  writeFile(path: string, data: Uint8Array): void;
  readFile(path: string): Uint8Array;
  unlink(path: string): void;
}

interface QpdfInstance {
  callMain(args: string[]): number;
  FS: QpdfFs;
}

/** The package's own .d.ts omits `noInitialRun`, so the factory is
 *  typed locally (verified against the README + runtime behaviour). */
type QpdfModuleFactory = (opts: {
  locateFile: () => string;
  noInitialRun?: boolean;
}) => Promise<QpdfInstance>;

const moduleCache = new Map<string, Promise<QpdfInstance>>();

async function loadQpdf(wasmUrl: string): Promise<QpdfInstance> {
  const cached = moduleCache.get(wasmUrl);
  if (cached) return cached;
  const loaded = (async (): Promise<QpdfInstance> => {
    const { default: createModule } = (await import('@neslinesli93/qpdf-wasm')) as unknown as {
      default: QpdfModuleFactory;
    };
    const mod = await createModule({
      locateFile: () => wasmUrl,
      noInitialRun: true,
    });
    return mod;
  })();
  moduleCache.set(wasmUrl, loaded);
  return loaded;
}

/**
 * The WASM file's URL. In the browser it is the bundled asset
 * (`?url` import, emitted by Vite); in Node tests the caller passes
 * the filesystem path explicitly.
 */
export async function defaultWasmUrl(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('defaultWasmUrl needs a browser — pass the qpdf.wasm path explicitly');
  }
  const { default: wasmUrl } = await import('@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url');
  return wasmUrl;
}

export function isPdfFile(file: Blob, name?: string): boolean {
  return (
    file.type === 'application/pdf' ||
    (typeof name === 'string' && name.toLowerCase().endsWith('.pdf'))
  );
}

export function validateProtectOptions(userPassword: string, ownerPassword: string): void {
  if (typeof userPassword !== 'string' || userPassword.length < PDF_PROTECT_MIN_PASSWORD) {
    throw new Error(`Password must be at least ${PDF_PROTECT_MIN_PASSWORD} characters`);
  }
  if (typeof ownerPassword !== 'string') {
    throw new Error('Owner password must be a string');
  }
  if (ownerPassword.length > 0 && ownerPassword.length < PDF_PROTECT_MIN_PASSWORD) {
    throw new Error(`Owner password must be at least ${PDF_PROTECT_MIN_PASSWORD} characters`);
  }
}

function uniqueTag(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * Encrypt a PDF with a password (AES-256). The output needs the user
 * password (or the owner password) to open.
 *
 * @param pdf the source PDF as a File/Blob.
 * @param userPassword password required to open the file (min 4 chars).
 * @param ownerPassword optional full-access password; defaults to the
 *   user password when empty.
 * @param opts.wasmUrl override for the qpdf.wasm location (Node tests
 *   pass the filesystem path; the browser resolves the bundled asset).
 * @returns a Blob (`application/pdf`) of the encrypted file.
 * @throws on empty/non-PDF input, bad passwords, or a qpdf failure.
 */
export async function protectPdf(
  pdf: Blob,
  userPassword: string,
  ownerPassword = '',
  opts: { wasmUrl?: string } = {},
): Promise<Blob> {
  if (!(pdf instanceof Blob) || pdf.size === 0) {
    throw new Error('protectPdf needs a non-empty PDF file');
  }
  validateProtectOptions(userPassword, ownerPassword);
  const owner = ownerPassword.length > 0 ? ownerPassword : userPassword;
  const wasmUrl = opts.wasmUrl ?? (await defaultWasmUrl());
  const qpdf = await loadQpdf(wasmUrl);
  const tag = uniqueTag();
  const inPath = `/in-${tag}.pdf`;
  const outPath = `/out-${tag}.pdf`;
  try {
    qpdf.FS.writeFile(inPath, new Uint8Array(await pdf.arrayBuffer()));
    const code = qpdf.callMain([
      '--encrypt',
      userPassword,
      owner,
      '256',
      '--',
      inPath,
      outPath,
    ]);
    if (code !== QPDF_EXIT_OK) {
      throw new Error('Could not protect this PDF — it may be corrupt or already encrypted');
    }
    const bytes = qpdf.FS.readFile(outPath);
    if (bytes.length === 0) {
      throw new Error('Could not protect this PDF — the output was empty');
    }
    return new Blob([bytes as BlobPart], { type: 'application/pdf' });
  } finally {
    for (const p of [inPath, outPath]) {
      try {
        qpdf.FS.unlink(p);
      } catch {
        /* already gone — ignore */
      }
    }
  }
}

export type ProtectedCheck = 'ok' | 'wrong-password' | 'not-encrypted';

/**
 * Check a PDF's protection state with QPDF itself:
 * - 'not-encrypted' — `qpdf --check` opens the file with no password.
 * - 'ok' — the file needs a password, and `password` opens it.
 * - 'wrong-password' — the file needs a password, but `password`
 *   does not open it.
 *
 * (Verified 27 Nov 2026: --check exits 0 on a valid unencrypted
 * PDF and 2 on an encrypted one without a password; 0 with the
 * right password, 2 with a wrong one. --show-encryption is NOT
 * used here — its exit code does not distinguish the two states.)
 */
export async function checkProtectedPdf(
  pdf: Blob,
  password: string,
  opts: { wasmUrl?: string } = {},
): Promise<ProtectedCheck> {
  if (!(pdf instanceof Blob) || pdf.size === 0) {
    throw new Error('checkProtectedPdf needs a non-empty PDF file');
  }
  const wasmUrl = opts.wasmUrl ?? (await defaultWasmUrl());
  const qpdf = await loadQpdf(wasmUrl);
  const tag = uniqueTag();
  const inPath = `/check-${tag}.pdf`;
  try {
    qpdf.FS.writeFile(inPath, new Uint8Array(await pdf.arrayBuffer()));
    // No password: a valid unencrypted file checks fine (exit 0);
    // an encrypted file fails (exit 2).
    const plainCode = qpdf.callMain(['--check', inPath]);
    if (plainCode === QPDF_EXIT_OK) return 'not-encrypted';
    const checkCode = qpdf.callMain([`--password=${password}`, '--check', inPath]);
    return checkCode === QPDF_EXIT_OK ? 'ok' : 'wrong-password';
  } finally {
    try {
      qpdf.FS.unlink(inPath);
    } catch {
      /* already gone — ignore */
    }
  }
}
