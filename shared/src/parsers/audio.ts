import { parseBlob } from "music-metadata-browser";
import { ID3Writer } from "browser-id3-writer";
import type { EditedValue, MetadataField, Parser, ParsedMetadata } from "../types";
import { formatBytes, formatDuration, extensionOf } from "../utils/format";

const CONSUMED_COMMON_KEYS = new Set([
  "title", "artist", "artists", "albumartist", "album", "composer",
  "genre", "year", "date", "track", "disk", "comment", "lyrics", "picture",
]);

const MP3_TYPES = ["audio/mpeg", "audio/mp3"];

function isMp3(file: File) {
  return MP3_TYPES.includes(file.type) || extensionOf(file.name) === "mp3";
}

export const audioParser: Parser = {
  category: "audio",
  matches: (file) =>
    file.type.startsWith("audio/") || ["mp3", "flac", "wav", "ogg", "m4a", "aac", "wma"].includes(extensionOf(file.name)),

  async parse(file: File): Promise<ParsedMetadata> {
    const meta = await parseBlob(file, { skipCovers: true });
    const c = meta.common;
    const f = meta.format;

    const overview: MetadataField[] = [
      { key: "container", label: "Container", value: f.container ?? null, kind: "readonly", editable: false },
      { key: "codec", label: "Codec", value: f.codec ?? null, kind: "readonly", editable: false },
      { key: "duration", label: "Duration", value: formatDuration(f.duration), kind: "readonly", editable: false },
      { key: "bitrate", label: "Bitrate", value: f.bitrate ? `${Math.round(f.bitrate / 1000)} kbps` : null, kind: "readonly", editable: false },
      { key: "sampleRate", label: "Sample rate", value: f.sampleRate ? `${f.sampleRate} Hz` : null, kind: "readonly", editable: false },
      { key: "channels", label: "Channels", value: f.numberOfChannels ?? null, kind: "readonly", editable: false },
      { key: "size", label: "Size", value: formatBytes(file.size), kind: "readonly", editable: false },
    ];

    const track: MetadataField[] = [
      { key: "title", label: "Title", value: c.title ?? null, kind: "text", editable: isMp3(file) },
      { key: "album", label: "Album", value: c.album ?? null, kind: "text", editable: isMp3(file) },
      { key: "track", label: "Track number", value: c.track?.no ?? null, kind: "text", editable: isMp3(file) },
      { key: "genre", label: "Genre", value: c.genre?.join(", ") ?? null, kind: "text", editable: isMp3(file) },
      { key: "year", label: "Year", value: c.year ?? null, kind: "text", editable: isMp3(file) },
    ];

    const origin: MetadataField[] = [
      { key: "artist", label: "Artist", value: c.artist ?? null, kind: "text", editable: isMp3(file) },
      { key: "albumartist", label: "Album artist", value: c.albumartist ?? null, kind: "text", editable: isMp3(file) },
      { key: "composer", label: "Composer", value: c.composer?.join(", ") ?? null, kind: "text", editable: isMp3(file) },
    ];

    const notes: MetadataField[] = [
      { key: "comment", label: "Comment", value: c.comment?.map((x: any) => (typeof x === "string" ? x : x.text)).join(" / ") ?? null, kind: "longtext", editable: isMp3(file) },
    ];

    const hiddenEntries = Object.entries(c).filter(
      ([k, v]) => !CONSUMED_COMMON_KEYS.has(k) && v != null && (typeof v !== "object" || Array.isArray(v))
    );
    const hidden: MetadataField[] = hiddenEntries.map(([k, v]) => ({
      key: `raw.${k}`,
      label: k,
      value: Array.isArray(v) ? v.join(", ") : String(v),
      kind: "readonly",
      editable: false,
    }));

    return {
      category: "audio",
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      write: isMp3(file)
        ? { supported: true }
        : { supported: false, reason: "Writing tags back is currently supported for MP3 only. Other audio formats are shown read-only." },
      groups: [
        { id: "overview", tag: "overview", title: "Overview", fields: overview },
        { id: "track", tag: "track", title: "Track info", fields: track },
        { id: "origin", tag: "origin", title: "Origin & authorship", fields: origin },
        { id: "notes", tag: "notes", title: "Notes", fields: notes },
        ...(hidden.length ? [{ id: "hidden", tag: "raw", title: `Other tags (${hidden.length})`, fields: hidden }] : []),
      ],
    };
  },

  async write(file: File, edits: EditedValue[]): Promise<Blob> {
    if (!isMp3(file)) throw new Error("Writing tags is only supported for MP3 files.");
    const buffer = await file.arrayBuffer();
    const writer = new ID3Writer(buffer);
    const map: Record<string, string> = Object.fromEntries(edits.map((e) => [e.key, e.value]));

    if (map.title !== undefined) writer.setFrame("TIT2", map.title);
    if (map.artist !== undefined) writer.setFrame("TPE1", [map.artist]);
    if (map.albumartist !== undefined) writer.setFrame("TPE2", map.albumartist);
    if (map.composer !== undefined) writer.setFrame("TCOM", [map.composer]);
    if (map.album !== undefined) writer.setFrame("TALB", map.album);
    if (map.genre !== undefined) writer.setFrame("TCON", [map.genre]);
    if (map.year !== undefined && /^\d{4}$/.test(map.year)) writer.setFrame("TYER" as any, map.year);
    if (map.track !== undefined) writer.setFrame("TRCK", map.track);
    if (map.comment !== undefined) {
      writer.setFrame("COMM", { description: "", text: map.comment, language: "eng" });
    }

    writer.addTag();
    return writer.getBlob();
  },
};
