// In-app file download (app audit, 24 Nov 2026): a stock Android
// WebView does not download blob: URLs, and jsPDF's save() uses the
// same blob-anchor mechanism — inside the app both silently do nothing
// (the old APK had no DownloadListener either). Inside the Capacitor
// app, write the file to the app cache and open the system share sheet
// (Filesystem + Share plugins, dynamic import, native-app only); the
// share sheet lets the user save to Downloads / Drive / etc. Outside
// the app this module does nothing and callers fall back to the normal
// anchor download.
//
// Files are written under Cache/shared/ — the only cache path the
// app's FileProvider shares (see file_paths.xml in the wrapper). The
// cache is pruned by the system; no manual cleanup is needed for v1.
// Direct http(s) file links do NOT go through here — the native
// DownloadListener in MainActivity hands those to DownloadManager.
import { isNativeApp } from './isNativeApp';

export async function downloadBlobInApp(
  blob: Blob,
  filename: string,
): Promise<boolean> {
  if (typeof window === 'undefined' || !isNativeApp()) {
    return false;
  }
  try {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const base64 = await blobToBase64(blob);
    const path = `shared/${filename}`;
    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
    });
    const { uri } = await Filesystem.getUri({
      path,
      directory: Directory.Cache,
    });
    await Share.share({ url: uri, dialogTitle: 'PDF সংরক্ষণ করুন' });
    return true;
  } catch {
    return false;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    // String.fromCharCode has an argument limit — build in chunks.
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
  });
}
