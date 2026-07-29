import React from "react";
import "../styles/scan-reveal.css";

export interface ScanRevealProps {
  /** Change this (e.g. to the file name) to replay the sweep for a new file */
  triggerKey: string | number;
  children: React.ReactNode;
}

export function ScanReveal({ triggerKey, children }: ScanRevealProps) {
  return (
    <div className="dt-scan-wrap" key={triggerKey}>
      <div className="dt-scan-line" aria-hidden="true" />
      <div className="dt-scan-content">{children}</div>
    </div>
  );
}
