import { PDFDocument } from "pdf-lib";
import type { EditedValue, Parser, ParsedMetadata } from "../types";
import { formatBytes, formatDate } from "../utils/format";

export const pdfParser: Parser = {
  category: "pdf",
  matches: (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),

  async parse(file: File): Promise<ParsedMetadata> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });

    return {
      category: "pdf",
      fileName: file.name,
      fileSize: file.size,
      mimeType: "application/pdf",
      write: { supported: true },
      groups: [
        {
          id: "overview",
          tag: "overview",
          title: "Overview",
          fields: [
            { key: "pageCount", label: "Pages", value: doc.getPageCount(), kind: "readonly", editable: false },
            { key: "size", label: "Size", value: formatBytes(file.size), kind: "readonly", editable: false },
          ],
        },
        {
          id: "origin",
          tag: "origin",
          title: "Origin & authorship",
          fields: [
            { key: "Title", label: "Title", value: doc.getTitle() ?? null, kind: "text", editable: true },
            { key: "Author", label: "Author", value: doc.getAuthor() ?? null, kind: "text", editable: true },
            { key: "Subject", label: "Subject", value: doc.getSubject() ?? null, kind: "text", editable: true },
            { key: "Keywords", label: "Keywords", value: doc.getKeywords() ?? null, kind: "text", editable: true },
          ],
        },
        {
          id: "timestamps",
          tag: "time",
          title: "Timestamps",
          fields: [
            { key: "CreationDate", label: "Created", value: doc.getCreationDate() ? formatDate(doc.getCreationDate()) : null, kind: "date", editable: true, hint: "Any format JavaScript's Date can parse, e.g. 2026-03-12" },
            { key: "ModificationDate", label: "Modified", value: doc.getModificationDate() ? formatDate(doc.getModificationDate()) : null, kind: "date", editable: true, hint: "Left blank on save, this updates to the current time automatically" },
          ],
        },
        {
          id: "technical",
          tag: "technical",
          title: "Producer & tooling",
          fields: [
            { key: "Producer", label: "Producer", value: doc.getProducer() ?? null, kind: "text", editable: true, hint: "The software that generated the PDF bytes" },
            { key: "Creator", label: "Creator application", value: doc.getCreator() ?? null, kind: "text", editable: true, hint: "The application the author used, e.g. a word processor" },
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
    return new Blob([out], { type: "application/pdf" });
  },
};
