import type { EditedValue, ParsedMetadata } from "../types";
import { detectCategory } from "../detect";
import { imageParser } from "./image";
import { pdfParser } from "./pdf";
import { officeParser } from "./office";
import { audioParser } from "./audio";
import { videoParser } from "./video";
import { genericParser } from "./generic";

const parsers = [imageParser, pdfParser, officeParser, audioParser, videoParser, genericParser];

function parserFor(file: File) {
  const category = detectCategory(file);
  return parsers.find((p) => p.category === category) ?? genericParser;
}

export async function parseFile(file: File): Promise<ParsedMetadata> {
  const parser = parserFor(file);
  try {
    return await parser.parse(file);
  } catch (err) {
    // Never let a single format's quirks crash the app — fall back to generic info.
    const fallback = await genericParser.parse(file);
    fallback.write = {
      supported: false,
      reason: err instanceof Error ? `Couldn't fully read this file: ${err.message}` : "Couldn't fully read this file.",
    };
    return fallback;
  }
}

export async function writeFile(file: File, edits: EditedValue[]): Promise<Blob> {
  const parser = parserFor(file);
  if (!parser.write) throw new Error("This file type doesn't support writing metadata yet.");
  return parser.write(file, edits);
}

export { detectCategory } from "../detect";
export * from "../types";
