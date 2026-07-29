import React from "react";
import type { MetadataGroup } from "../types";
import { FieldRow } from "./FieldRow";

export interface SectionCardProps {
  group: MetadataGroup;
  editing: boolean;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function SectionCard({ group, editing, values, onChange }: SectionCardProps) {
  return (
    <section className="rounded-[var(--dt-radius-md)] border border-[var(--dt-border)] bg-[var(--dt-surface)] p-5">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="font-[var(--dt-font-mono)] text-xs text-[var(--dt-accent)]">// {group.tag}</span>
      </div>
      <h3 className="mb-3 font-[var(--dt-font-display)] text-base font-medium text-[var(--dt-text-primary)]">
        {group.title}
      </h3>
      <div>
        {group.fields.map((field) => (
          <FieldRow
            key={field.key}
            field={field}
            value={values[field.key] ?? (field.value != null ? String(field.value) : "")}
            editing={editing}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  );
}
