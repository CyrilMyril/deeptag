import type { FileCategory } from "./types";
import { extensionOf } from "./utils/format";

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "tiff", "tif", "heic", "gif", "bmp"];
const PDF_EXT = ["pdf"];
const OFFICE_EXT = ["docx", "xlsx", "pptx", "dotx", "xltx", "potx"];
const AUDIO_EXT = ["mp3", "flac", "wav", "ogg", "m4a", "aac", "wma"];
const VIDEO_EXT = ["mp4", "mov", "m4v", "3gp"];

export function detectCategory(file: File): FileCategory {
  const ext = extensionOf(file.name);
  const mime = file.type;

  if (mime.startsWith("image/") || IMAGE_EXT.includes(ext)) return "image";
  if (mime === "application/pdf" || PDF_EXT.includes(ext)) return "pdf";
  if (OFFICE_EXT.includes(ext)) return "office";
  if (mime.startsWith("audio/") || AUDIO_EXT.includes(ext)) return "audio";
  if (mime.startsWith("video/") || VIDEO_EXT.includes(ext)) return "video";
  return "generic";
}
