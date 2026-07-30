export type FileCategory =
  | "image"
  | "pdf"
  | "office"
  | "audio"
  | "video"
  | "generic";

export type FieldKind = "text" | "number" | "date" | "longtext" | "readonly";

export interface MetadataField {
  /** Stable key used when writing edits back, e.g. "exif.Artist" */
  key: string;
  /** Human label, e.g. "Artist" */
  label: string;
  value: string | number | null;
  kind: FieldKind;
  /** Can this single field be edited and written back? */
  editable: boolean;
  /** Optional short explanation shown on hover/help, for less obvious fields */
  hint?: string;
}

export interface MetadataGroup {
  id: string;
  /** Short mono "tag" shown as an eyebrow, e.g. "origin", "technical" */
  tag: string;
  title: string;
  fields: MetadataField[];
}

export interface WriteCapability {
  /** Can any field in this file be edited at all? */
  supported: boolean;
  /** Human-readable reason shown when not supported */
  reason?: string;
  /** Non-blocking caution shown even when supported is true */
  warning?: string;
}

export interface ParsedMetadata {
  category: FileCategory;
  fileName: string;
  fileSize: number;
  mimeType: string;
  groups: MetadataGroup[];
  write: WriteCapability;
}

export interface EditedValue {
  key: string;
  value: string;
}

/** How the host app should persist edits */
export type SaveMode = "in-place" | "copy";

export interface Parser {
  category: FileCategory;
  /** Quick check based on mime type / extension */
  matches: (file: File) => boolean;
  parse: (file: File) => Promise<ParsedMetadata>;
  /** Returns a new Blob with edits applied. Throws if write.supported is false. */
  write?: (file: File, edits: EditedValue[]) => Promise<Blob>;
}