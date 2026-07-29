import React from "react";
import type { MetadataField } from "../types";
import { Badge } from "./Badge";

export interface FieldRowProps {
  field: MetadataField;
  value: string;
  editing: boolean;
  onChange: (key: string, value: string) => void;
}

export function FieldRow({ field, value, editing, onChange }: FieldRowProps) {
  const isEmpty = field.value === null || field.value === undefined || field.value === "";
  const canEditNow = editing && field.editable;

  return (
    <div className="flex flex-col gap-1.5 border-b border-[var(--dt-border)] py-3 last:border-b-0 sm:flex-row sm:gap-4">
      <div className="flex w-full min-w-0 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 sm:w-48 sm:pt-1.5">
        <span className="min-w-0 truncate text-sm text-[var(--dt-text-secondary)]" title={field.hint ?? field.label}>
          {field.label}
        </span>
        {editing && <Badge kind={field.editable ? "editable" : "readonly"} />}
      </div>

      <div className="min-w-0 flex-1">
        {canEditNow ? (
          field.kind === "longtext" ? (
            <textarea
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              rows={2}
              className="w-full min-w-0 resize-none rounded-[var(--dt-radius-sm)] border border-[var(--dt-border-strong)] bg-[var(--dt-bg-raised)] px-3 py-1.5 font-[var(--dt-font-mono)] text-sm text-[var(--dt-text-primary)] outline-none focus:border-[var(--dt-accent)]"
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full min-w-0 rounded-[var(--dt-radius-sm)] border border-[var(--dt-border-strong)] bg-[var(--dt-bg-raised)] px-3 py-1.5 font-[var(--dt-font-mono)] text-sm text-[var(--dt-text-primary)] outline-none focus:border-[var(--dt-accent)]"
            />
          )
        ) : (
          <span
            className={[
              "block break-all font-[var(--dt-font-mono)] text-sm sm:pt-1.5",
              isEmpty ? "italic text-[var(--dt-text-muted)]" : "text-[var(--dt-text-primary)]",
            ].join(" ")}
          >
            {isEmpty ? "Not present in this file" : String(field.value)}
          </span>
        )}
      </div>
    </div>
  );
}