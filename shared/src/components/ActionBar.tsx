import React from "react";
import type { SaveMode } from "../types";
import { EditIcon, SaveIcon, CopyIcon, CloseIcon, AlertIcon } from "./icons";

export interface ActionBarProps {
  editing: boolean;
  hasChanges: boolean;
  canWrite: boolean;
  writeReason?: string;
  busy?: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (mode: SaveMode) => void;
}

const buttonBase =
  "inline-flex items-center gap-2 rounded-[var(--dt-radius-sm)] px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function ActionBar({ editing, hasChanges, canWrite, writeReason, busy, onStartEdit, onCancelEdit, onSave }: ActionBarProps) {
  if (!editing) {
    return (
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onStartEdit}
          disabled={!canWrite}
          className={[buttonBase, "border border-[var(--dt-accent)]/50 text-[var(--dt-accent)] hover:bg-[var(--dt-accent-soft)]"].join(" ")}
        >
          <EditIcon width={16} height={16} />
          Edit metadata
        </button>
        {!canWrite && writeReason && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--dt-text-muted)]">
            <AlertIcon width={14} height={14} />
            {writeReason}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onCancelEdit}
        disabled={busy}
        className={[buttonBase, "border border-[var(--dt-border-strong)] text-[var(--dt-text-secondary)] hover:text-[var(--dt-text-primary)]"].join(" ")}
      >
        <CloseIcon width={16} height={16} />
        Cancel
      </button>
      <button
        onClick={() => onSave("copy")}
        disabled={!hasChanges || busy}
        className={[buttonBase, "border border-[var(--dt-data)]/50 text-[var(--dt-data)] hover:bg-[var(--dt-data-soft)]"].join(" ")}
      >
        <CopyIcon width={16} height={16} />
        Save as copy
      </button>
      <button
        onClick={() => onSave("in-place")}
        disabled={!hasChanges || busy}
        className={[buttonBase, "bg-[var(--dt-accent)] text-[#1A1206] hover:brightness-110"].join(" ")}
      >
        <SaveIcon width={16} height={16} />
        Save to original file
      </button>
    </div>
  );
}
