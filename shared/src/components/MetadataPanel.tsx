import React from "react";
import type { ParsedMetadata, SaveMode } from "../types";
import { formatBytes } from "../utils/format";
import { FileIcon, CloseIcon } from "./icons";
import { ScanReveal } from "./ScanReveal";
import { SectionCard } from "./SectionCard";
import { ActionBar } from "./ActionBar";

export interface MetadataPanelProps {
  meta: ParsedMetadata;
  editing: boolean;
  values: Record<string, string>;
  hasChanges: boolean;
  busy?: boolean;
  onChange: (key: string, value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (mode: SaveMode) => void;
  onReset: () => void;
}

const CATEGORY_LABEL: Record<ParsedMetadata["category"], string> = {
  image: "Image", pdf: "PDF", office: "Document", audio: "Audio", video: "Video", generic: "File",
};

export function MetadataPanel({ meta, editing, values, hasChanges, busy, onChange, onStartEdit, onCancelEdit, onSave, onReset }: MetadataPanelProps) {
  return (
    <ScanReveal triggerKey={`${meta.fileName}-${meta.fileSize}`}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3 rounded-[var(--dt-radius-md)] border border-[var(--dt-border)] bg-[var(--dt-surface)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--dt-radius-sm)] bg-[var(--dt-accent-soft)] text-[var(--dt-accent)]">
              <FileIcon width={18} height={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-[var(--dt-font-display)] text-sm font-medium text-[var(--dt-text-primary)]">
                {meta.fileName}
              </p>
              <p className="text-xs text-[var(--dt-text-secondary)]">
                {CATEGORY_LABEL[meta.category]} · {formatBytes(meta.fileSize)}
              </p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="flex shrink-0 items-center gap-1.5 rounded-[var(--dt-radius-sm)] px-2.5 py-1.5 text-xs text-[var(--dt-text-secondary)] hover:text-[var(--dt-text-primary)]"
          >
            <CloseIcon width={14} height={14} />
            Choose another file
          </button>
        </div>

        <ActionBar
          editing={editing}
          hasChanges={hasChanges}
          canWrite={meta.write.supported}
          writeReason={meta.write.reason}
          busy={busy}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          onSave={onSave}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {meta.groups.map((group) => (
            <SectionCard key={group.id} group={group} editing={editing} values={values} onChange={onChange} />
          ))}
        </div>
      </div>
    </ScanReveal>
  );
}
