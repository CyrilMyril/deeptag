import React, { useCallback, useRef, useState } from "react";
import { UploadIcon } from "./icons";

declare global {
  interface Window {
    showOpenFilePicker?: (options?: any) => Promise<any[]>;
  }
  interface DataTransferItem {
    getAsFileSystemHandle?: () => Promise<any>;
  }
}

export interface UploadZoneProps {
  /** handle is only populated in Chromium browsers that support the File System Access API */
  onFile: (file: File, handle?: any) => void;
  isLoading?: boolean;
  helperText?: string;
  className?: string;
  /** Set false to skip the File System Access API and always use a plain <input type=file> */
  tryFileSystemAccess?: boolean;
}

export function UploadZone({ onFile, isLoading, helperText, className = "", tryFileSystemAccess = false }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleClick = useCallback(async () => {
    if (tryFileSystemAccess && typeof window !== "undefined" && window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker();
        const file = await handle.getFile();
        onFile(file, handle);
        return;
      } catch {
        // user cancelled, or API unsupported at runtime — fall through to input
      }
    }
    inputRef.current?.click();
  }, [onFile, tryFileSystemAccess]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const item = e.dataTransfer.items?.[0];
      if (tryFileSystemAccess && item?.getAsFileSystemHandle) {
        try {
          const handle = await item.getAsFileSystemHandle();
          if (handle && handle.kind === "file") {
            const file = await handle.getFile();
            onFile(file, handle);
            return;
          }
        } catch {
          // fall through to plain file drop
        }
      }
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles, onFile, tryFileSystemAccess]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload a file to inspect its metadata"
      onClick={handleClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={[
        "group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[var(--dt-radius-lg)] border-2 border-dashed px-8 py-16 text-center transition-all duration-200",
        dragging
          ? "border-[var(--dt-accent)] bg-[var(--dt-accent-soft)]"
          : "border-[var(--dt-border-strong)] bg-[var(--dt-surface)] hover:border-[var(--dt-accent)]/60",
        className,
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        className={[
          "flex h-16 w-16 items-center justify-center rounded-full border transition-colors",
          dragging ? "border-[var(--dt-accent)] text-[var(--dt-accent)]" : "border-[var(--dt-border-strong)] text-[var(--dt-text-secondary)] group-hover:text-[var(--dt-accent)] group-hover:border-[var(--dt-accent)]",
        ].join(" ")}
      >
        <UploadIcon width={26} height={26} />
      </div>

      <div>
        <p className="font-[var(--dt-font-display)] text-lg font-medium text-[var(--dt-text-primary)]">
          {isLoading ? "Reading file…" : "Drop a file to see what it's really carrying"}
        </p>
        <p className="mt-1 text-sm text-[var(--dt-text-secondary)]">
          {helperText ?? "or click to browse"}
        </p>
      </div>
    </div>
  );
}
