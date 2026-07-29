import { contextBridge, ipcRenderer, webUtils } from "electron";

export interface ElectronAPI {
  getPathForFile: (file: File) => string;
  saveAsCopy: (buffer: ArrayBuffer, suggestedName: string) => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
  saveInPlace: (buffer: ArrayBuffer, filePath: string) => Promise<{ success: boolean; path?: string }>;
}

const api: ElectronAPI = {
  getPathForFile: (file) => webUtils.getPathForFile(file),
  saveAsCopy: (buffer, suggestedName) => ipcRenderer.invoke("save-as-copy", buffer, suggestedName),
  saveInPlace: (buffer, filePath) => ipcRenderer.invoke("save-in-place", buffer, filePath),
};

contextBridge.exposeInMainWorld("electronAPI", api);
