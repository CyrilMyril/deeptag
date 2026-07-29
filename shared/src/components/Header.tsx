import React from "react";
import { LensIcon } from "./icons";

export interface HeaderProps {
  right?: React.ReactNode;
}

export function Header({ right }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--dt-border)] px-6 py-4 sm:px-10">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--dt-radius-sm)] border border-[var(--dt-accent)]/40 text-[var(--dt-accent)]">
          <LensIcon width={18} height={18} />
        </span>
        <span className="font-[var(--dt-font-display)] text-lg font-semibold tracking-tight text-[var(--dt-text-primary)]">
          DeepTag
        </span>
      </div>
      {right}
    </header>
  );
}
