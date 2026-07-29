import JSZip from "jszip";
import type { EditedValue, Parser, ParsedMetadata } from "../types";
import { formatBytes, formatDate, extensionOf } from "../utils/format";

const KIND_LABEL: Record<string, string> = {
  docx: "Word document", dotx: "Word template",
  xlsx: "Excel workbook", xltx: "Excel template",
  pptx: "PowerPoint presentation", potx: "PowerPoint template",
};

function extractXmlValue(xml: string, tag: string): string | null {
  const openClose = new RegExp(`<(?:[\\w]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w]+:)?${tag}>`);
  const match = xml.match(openClose);
  if (match) return decodeXmlEntities(match[1]);
  const selfClosing = new RegExp(`<(?:[\\w]+:)?${tag}(?:\\s[^>]*)?\\/>`);
  return selfClosing.test(xml) ? "" : null;
}

function decodeXmlEntities(s: string): string {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

function encodeXmlEntities(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function setXmlValue(xml: string, tag: string, qualifiedInsertTag: string, rootCloseTag: string, value: string): string {
  const openClose = new RegExp(`(<(?:[\\w]+:)?${tag}(?:\\s[^>]*)?>)([\\s\\S]*?)(<\\/(?:[\\w]+:)?${tag}>)`);
  if (openClose.test(xml)) {
    return xml.replace(openClose, (_m, open, _inner, close) => `${open}${encodeXmlEntities(value)}${close}`);
  }
  const selfClosing = new RegExp(`<(?:[\\w]+:)?${tag}(?:\\s[^>]*)?\\/>`);
  if (selfClosing.test(xml)) {
    return xml.replace(selfClosing, `<${qualifiedInsertTag}>${encodeXmlEntities(value)}</${qualifiedInsertTag}>`);
  }
  // Element absent entirely: insert just before the root closing tag.
  return xml.replace(rootCloseTag, `<${qualifiedInsertTag}>${encodeXmlEntities(value)}</${qualifiedInsertTag}>${rootCloseTag}`);
}

export const officeParser: Parser = {
  category: "office",
  matches: (file) => ["docx", "xlsx", "pptx", "dotx", "xltx", "potx"].includes(extensionOf(file.name)),

  async parse(file: File): Promise<ParsedMetadata> {
    const ext = extensionOf(file.name);
    const zip = await JSZip.loadAsync(file);
    const coreXml = (await zip.file("docProps/core.xml")?.async("string")) ?? "";
    const appXml = (await zip.file("docProps/app.xml")?.async("string")) ?? "";

    const get = (xml: string, tag: string) => extractXmlValue(xml, tag);

    return {
      category: "office",
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      write: coreXml ? { supported: true } : { supported: false, reason: "No docProps/core.xml found in this file — it may be corrupted or from an unsupported source." },
      groups: [
        {
          id: "overview",
          tag: "overview",
          title: "Overview",
          fields: [
            { key: "kind", label: "Document type", value: KIND_LABEL[ext] ?? ext.toUpperCase(), kind: "readonly", editable: false },
            { key: "size", label: "Size", value: formatBytes(file.size), kind: "readonly", editable: false },
            { key: "Application", label: "Created with", value: get(appXml, "Application"), kind: "text", editable: !!appXml },
          ],
        },
        {
          id: "origin",
          tag: "origin",
          title: "Origin & authorship",
          fields: [
            { key: "title", label: "Title", value: get(coreXml, "title"), kind: "text", editable: true },
            { key: "creator", label: "Author", value: get(coreXml, "creator"), kind: "text", editable: true },
            { key: "subject", label: "Subject", value: get(coreXml, "subject"), kind: "text", editable: true },
            { key: "description", label: "Description", value: get(coreXml, "description"), kind: "longtext", editable: true },
            { key: "keywords", label: "Keywords", value: get(coreXml, "keywords"), kind: "text", editable: true },
            { key: "lastModifiedBy", label: "Last modified by", value: get(coreXml, "lastModifiedBy"), kind: "text", editable: true },
          ],
        },
        {
          id: "timestamps",
          tag: "time",
          title: "Timestamps",
          fields: [
            { key: "created", label: "Created", value: get(coreXml, "created") ? formatDate(get(coreXml, "created")!) : null, kind: "date", editable: true, hint: "Any format JavaScript's Date can parse" },
            { key: "modified", label: "Modified", value: get(coreXml, "modified") ? formatDate(get(coreXml, "modified")!) : null, kind: "date", editable: true, hint: "Left blank on save, this updates to the current time automatically" },
            { key: "revision", label: "Revision number", value: get(coreXml, "revision"), kind: "text", editable: true },
          ],
        },
        {
          id: "technical",
          tag: "technical",
          title: "Origin company",
          fields: [
            { key: "Company", label: "Company", value: get(appXml, "Company"), kind: "text", editable: !!appXml },
            { key: "AppVersion", label: "App version", value: get(appXml, "AppVersion"), kind: "text", editable: !!appXml },
          ],
        },
      ],
    };
  },

  async write(file: File, edits: EditedValue[]): Promise<Blob> {
    const zip = await JSZip.loadAsync(file);
    let coreXml = await zip.file("docProps/core.xml")?.async("string");
    if (!coreXml) throw new Error("This file has no docProps/core.xml to write metadata into.");
    let appXml = await zip.file("docProps/app.xml")?.async("string");

    const rootCloseCore = "</cp:coreProperties>";
    const coreTagMap: Record<string, string> = {
      title: "dc:title", creator: "dc:creator", subject: "dc:subject",
      description: "dc:description", keywords: "cp:keywords", lastModifiedBy: "cp:lastModifiedBy",
      revision: "cp:revision",
    };

    const map: Record<string, string> = Object.fromEntries(edits.map((e) => [e.key, e.value]));

    for (const [key, qualified] of Object.entries(coreTagMap)) {
      if (map[key] === undefined) continue;
      const localTag = qualified.split(":")[1];
      coreXml = setXmlValue(coreXml, localTag, qualified, rootCloseCore, map[key]);
    }

    if (map.created) {
      const d = new Date(map.created);
      if (!Number.isNaN(d.getTime())) {
        coreXml = setXmlValue(coreXml, "created", "dcterms:created", rootCloseCore, d.toISOString());
      }
    }
    if (map.modified) {
      const d = new Date(map.modified);
      coreXml = setXmlValue(coreXml, "modified", "dcterms:modified", rootCloseCore, Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString());
    } else {
      coreXml = setXmlValue(coreXml, "modified", "dcterms:modified", rootCloseCore, new Date().toISOString());
    }

    zip.file("docProps/core.xml", coreXml);

    if (appXml) {
      const rootCloseApp = "</Properties>";
      const appTagMap: Record<string, string> = { Application: "Application", Company: "Company", AppVersion: "AppVersion" };
      let changed = false;
      for (const [key, qualified] of Object.entries(appTagMap)) {
        if (map[key] === undefined) continue;
        changed = true;
        appXml = setXmlValue(appXml, qualified, qualified, rootCloseApp, map[key]);
      }
      if (changed) zip.file("docProps/app.xml", appXml);
    }

    const out = await zip.generateAsync({ type: "blob", mimeType: file.type });
    return out;
  },
};
