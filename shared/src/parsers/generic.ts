import type { Parser, ParsedMetadata } from "../types";
import { formatBytes, formatDate, extensionOf } from "../utils/format";

export const genericParser: Parser = {
  category: "generic",
  matches: () => true, // fallback: always matches

  async parse(file: File): Promise<ParsedMetadata> {
    return {
      category: "generic",
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      write: {
        supported: false,
        reason: "DeepTag doesn't recognize this file format yet, so it can only show what your operating system already knows about it.",
      },
      groups: [
        {
          id: "file",
          tag: "file",
          title: "File",
          fields: [
            { key: "name", label: "Name", value: file.name, kind: "readonly", editable: false },
            { key: "extension", label: "Extension", value: extensionOf(file.name) || "none", kind: "readonly", editable: false },
            { key: "type", label: "Reported type", value: file.type || "unknown", kind: "readonly", editable: false },
            { key: "size", label: "Size", value: formatBytes(file.size), kind: "readonly", editable: false },
            {
              key: "lastModified",
              label: "Last modified",
              value: formatDate(file.lastModified),
              kind: "readonly",
              editable: false,
            },
          ],
        },
      ],
    };
  },
};
