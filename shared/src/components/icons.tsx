import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const LensIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.3" y1="15.3" x2="20.5" y2="20.5" />
    <line x1="10.5" y1="7.5" x2="10.5" y2="13.5" />
    <line x1="7.5" y1="10.5" x2="13.5" y2="10.5" />
  </svg>
);

export const UploadIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 15V4" />
    <path d="M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);

export const FileIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
  </svg>
);

export const EditIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const SaveIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 3h11l3 3v15H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M8 3v6h7V3" />
    <path d="M7 21v-7h10v7" />
  </svg>
);

export const CopyIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="9" y="9" width="12" height="12" rx="1.5" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 12.5 9 17.5 20 6.5" />
  </svg>
);

export const AlertIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3 22 20H2Z" />
    <line x1="12" y1="9" x2="12" y2="14" />
    <circle cx="12" cy="17.3" r="0.4" fill="currentColor" stroke="none" />
  </svg>
);
