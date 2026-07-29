export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function copyFileName(originalName: string): string {
  const dot = originalName.lastIndexOf(".");
  if (dot === -1) return `${originalName} (edited)`;
  return `${originalName.slice(0, dot)} (edited)${originalName.slice(dot)}`;
}

/**
 * Writes `blob` back to `handle` if we have one (Chromium File System Access API).
 * Returns true on a genuine in-place write, false if it had to fall back to a download.
 */
export async function saveInPlace(handle: any | null | undefined, blob: Blob, fallbackName: string): Promise<boolean> {
  if (handle && typeof handle.createWritable === "function") {
    try {
      if (typeof handle.requestPermission === "function") {
        const perm = await handle.requestPermission({ mode: "readwrite" });
        if (perm !== "granted") throw new Error("permission denied");
      }
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch {
      // fall through to download fallback
    }
  }
  downloadBlob(blob, fallbackName);
  return false;
}
