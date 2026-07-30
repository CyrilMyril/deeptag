import { PDFDocument } from "pdf-lib";
import type { EditedValue, Parser, ParsedMetadata } from "../types";
import { formatBytes, formatDate } from "../utils/format";

/** Some fields (dates especially) throw instead of returning null when a PDF's
 *  strings are still encrypted (password-protected file, permissions-restricted
 *  file, or just malformed data) — never let one bad field take down the whole read. */
function safeGet<T>(fn: () => T): T | null {
  try {
    const v = fn();
    return v === undefined ? null : v;
  } catch {
    return null;
  }
}

export const pdfParser: Parser = {
  category: "pdf",
  matches: (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),

  async parse(file: File): Promise<ParsedMetadata> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
    const isEncrypted = !!doc.isEncrypted;
    const editable = true;

    const creationDate = safeGet(() => doc.getCreationDate());
    const modificationDate = safeGet(() => doc.getModificationDate());

    return {
      category: "pdf",
      fileName: file.name,
      fileSize: file.size,
      mimeType: "application/pdf",
      write: isEncrypted
        ? { supported: true, warning: "This PDF is encrypted or password-protected. Editing and saving may corrupt the file." }
        : { supported: true },
      groups: [
        {
          id: "overview",
          tag: "overview",
          title: "Overview",
          fields: [
            { key: "pageCount", label: "Pages", value: safeGet(() => doc.getPageCount()), kind: "readonly", editable: false },
            { key: "size", label: "Size", value: formatBytes(file.size), kind: "readonly", editable: false },
          ],
        },
        {
          id: "origin",
          tag: "origin",
          title: "Origin & authorship",
          fields: [
            { key: "Title", label: "Title", value: safeGet(() => doc.getTitle()) ?? null, kind: "text", editable },
            { key: "Author", label: "Author", value: safeGet(() => doc.getAuthor()) ?? null, kind: "text", editable },
            { key: "Subject", label: "Subject", value: safeGet(() => doc.getSubject()) ?? null, kind: "text", editable },
            { key: "Keywords", label: "Keywords", value: safeGet(() => doc.getKeywords()) ?? null, kind: "text", editable },
          ],
        },
        {
          id: "timestamps",
          tag: "time",
          title: "Timestamps",
          fields: [
            { key: "CreationDate", label: "Created", value: creationDate ? formatDate(creationDate) : null, kind: "date", editable, hint: "Any format JavaScript's Date can parse, e.g. 2026-03-12" },
            { key: "ModificationDate", label: "Modified", value: modificationDate ? formatDate(modificationDate) : null, kind: "date", editable, hint: "Left blank on save, this updates to the current time automatically" },
          ],
        },
        {
          id: "technical",
          tag: "technical",
          title: "Producer & tooling",
          fields: [
            { key: "Producer", label: "Producer", value: safeGet(() => doc.getProducer()) ?? null, kind: "text", editable, hint: "The software that generated the PDF bytes" },
            { key: "Creator", label: "Creator application", value: safeGet(() => doc.getCreator()) ?? null, kind: "text", editable, hint: "The application the author used, e.g. a word processor" },
          ],
        },
      ],
    };
  },

  async write(file: File, edits: EditedValue[]): Promise<Blob> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const map: Record<string, string> = Object.fromEntries(edits.map((e) => [e.key, e.value]));

    if (map.Title !== undefined) doc.setTitle(map.Title);
    if (map.Author !== undefined) doc.setAuthor(map.Author);
    if (map.Subject !== undefined) doc.setSubject(map.Subject);
    if (map.Keywords !== undefined) doc.setKeywords(map.Keywords.split(",").map((s) => s.trim()).filter(Boolean));
    if (map.Producer !== undefined) doc.setProducer(map.Producer);
    if (map.Creator !== undefined) doc.setCreator(map.Creator);

    if (map.CreationDate) {
      const d = new Date(map.CreationDate);
      if (!Number.isNaN(d.getTime())) doc.setCreationDate(d);
    }
    if (map.ModificationDate) {
      const d = new Date(map.ModificationDate);
      doc.setModificationDate(Number.isNaN(d.getTime()) ? new Date() : d);
    } else {
      doc.setModificationDate(new Date());
    }

    const out = await doc.save();
    return new Blob([out.slice().buffer], { type: "application/pdf" });
  },
};