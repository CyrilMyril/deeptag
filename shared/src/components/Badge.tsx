import React from "react";

export function Badge({ kind }: { kind: "editable" | "readonly" }) {
  const isEditable = kind === "editable";
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        isEditable
          ? "text-[var(--dt-data)] bg-[var(--dt-data-soft)]"
          : "text-[var(--dt-text-muted)] bg-white/[0.03]",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          isEditable ? "bg-[var(--dt-data)] shadow-[0_0_6px_var(--dt-data)]" : "bg-[var(--dt-text-muted)]",
        ].join(" ")}
      />
      {isEditable ? "Editable" : "Read-only"}
    </span>
  );
}