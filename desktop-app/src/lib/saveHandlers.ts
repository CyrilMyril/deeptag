export interface ElectronAPI {
  getPathForFile: (file: File) => string;
  saveAsCopy: (buffer: ArrayBuffer, suggestedName: string) => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
  saveInPlace: (buffer: ArrayBuffer, filePath: string) => Promise<{ success: boolean; path?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export function copyFileName(originalName: string): string {
  const dot = originalName.lastIndexOf(".");
  if (dot === -1) return `${originalName} (edited)`;
  return `${originalName.slice(0, dot)} (edited)${originalName.slice(dot)}`;
}

export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

/** Opens a native "Save As" dialog and writes the file. Returns the chosen path, or null if cancelled. */
export async function saveAsCopy(blob: Blob, suggestedName: string): Promise<string | null> {
  const buffer = await blobToArrayBuffer(blob);
  const result = await window.electronAPI.saveAsCopy(buffer, suggestedName);
  return result.success ? result.path ?? null : null;
}

/** Overwrites the original file at `filePath` directly. */
export async function saveInPlace(blob: Blob, filePath: string): Promise<boolean> {
  const buffer = await blobToArrayBuffer(blob);
  const result = await window.electronAPI.saveInPlace(buffer, filePath);
  return result.success;
}
