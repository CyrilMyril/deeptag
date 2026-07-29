import React, { useState } from "react";
import type { MetadataGroup } from "../types";
import { FieldRow } from "./FieldRow";

export interface SectionCardProps {
  group: MetadataGroup;
  editing: boolean;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const DEFAULT_VISIBLE = 12;

export function SectionCard({ group, editing, values, onChange }: SectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = group.fields.length > DEFAULT_VISIBLE;
  const visibleFields = expanded || !hasMore ? group.fields : group.fields.slice(0, DEFAULT_VISIBLE);

  return (
    <section className="rounded-[var(--dt-radius-md)] border border-[var(--dt-border)] bg-[var(--dt-surface)] p-5">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="font-[var(--dt-font-mono)] text-xs text-[var(--dt-accent)]">// {group.tag}</span>
      </div>
      <h3 className="mb-3 font-[var(--dt-font-display)] text-base font-medium text-[var(--dt-text-primary)]">
        {group.title}
      </h3>
      <div>
        {visibleFields.map((field) => (
          <FieldRow
            key={field.key}
            field={field}
            value={values[field.key] ?? (field.value != null ? String(field.value) : "")}
            editing={editing}
            onChange={onChange}
          />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 text-xs font-medium text-[var(--dt-accent)] hover:underline"
        >
          {expanded ? "Show fewer" : `Show all ${group.fields.length} tags`}
        </button>
      )}
    </section>
  );
}