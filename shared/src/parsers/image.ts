import exifr from "exifr";
import piexif from "piexifjs";
import type { EditedValue, MetadataField, Parser, ParsedMetadata } from "../types";
import { formatDate } from "../utils/format";

const CONSUMED_KEYS = new Set([
  "Make", "Model", "LensModel", "Software", "Artist", "Copyright",
  "ImageDescription", "DateTimeOriginal", "CreateDate", "ModifyDate",
  "latitude", "longitude", "GPSAltitude", "ExposureTime", "FNumber",
  "ISO", "FocalLength", "Orientation", "ColorSpace",
  "ExifImageWidth", "ExifImageHeight", "PixelXDimension", "PixelYDimension",
]);

const WRITABLE_JPEG_TYPES = ["image/jpeg", "image/jpg"];

// A couple of exifr's friendly key names don't match piexif's raw EXIF tag
// names — bridge those so both the "is this editable" check and the writer
// agree on the same underlying tag.
const KEY_ALIASES: Record<string, string> = {
  CreateDate: "DateTimeDigitized",
  ModifyDate: "DateTime",
  ISO: "ISOSpeedRatings",
};

// EXIF types whose byte layout isn't safe to guess-encode generically
// (raw byte blobs, opaque "undefined" fields like ExifVersion, MakerNote…).
const UNSAFE_TAG_TYPES = new Set(["Undefined", "Byte"]);

type IfdName = "0th" | "Exif" | "GPS";
interface TagInfo {
  ifd: IfdName;
  tag: number;
  type: string;
}

/** Every EXIF/TIFF/GPS tag piexif knows how to write, keyed by tag name. */
function buildTagIndex(): Record<string, TagInfo> {
  const index: Record<string, TagInfo> = {};
  const sections: [IfdName, string, Record<string, number>][] = [
    ["0th", "0th", piexif.ImageIFD],
    ["Exif", "Exif", piexif.ExifIFD],
    ["GPS", "GPS", piexif.GPSIFD],
  ];
  for (const [ifd, tagsKey, table] of sections) {
    for (const name of Object.keys(table)) {
      const tag = table[name];
      const type = piexif.TAGS?.[tagsKey]?.[tag]?.type ?? "Ascii";
      index[name] = { ifd, tag, type };
    }
  }
  return index;
}

const TAG_INDEX = buildTagIndex();

function resolveTag(exifrKey: string): TagInfo | null {
  const name = KEY_ALIASES[exifrKey] ?? exifrKey;
  const info = TAG_INDEX[name];
  return info ?? null;
}

function isWritableTag(exifrKey: string): boolean {
  const info = resolveTag(exifrKey);
  return !!info && !UNSAFE_TAG_TYPES.has(info.type);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a || 1 : gcd(b, a % b);
}

function toRational(value: number, precision = 10000): [number, number] {
  if (!Number.isFinite(value)) return [0, 1];
  if (Number.isInteger(value)) return [value, 1];
  const den = precision;
  const num = Math.round(value * den);
  const g = gcd(Math.abs(num), den);
  return [num / g, den / g];
}

function encodeForType(type: string, raw: string): any {
  switch (type) {
    case "Short":
    case "Long":
    case "SShort":
    case "SLong": {
      const n = parseInt(raw, 10);
      return Number.isNaN(n) ? 0 : n;
    }
    case "Rational":
    case "SRational": {
      const n = parseFloat(raw);
      return Number.isNaN(n) ? [0, 1] : toRational(n);
    }
    default:
      return raw; // Ascii and anything else: pass through as text
  }
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataURLToBlob(dataUrl: string, mime: string): Blob {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function readPixelSize(file: File): Promise<{ width?: number; height?: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return size;
  } catch {
    return {};
  }
}

export const imageParser: Parser = {
  category: "image",
  matches: (file) => file.type.startsWith("image/"),

  async parse(file: File): Promise<ParsedMetadata> {
    const isJpeg = WRITABLE_JPEG_TYPES.includes(file.type);
    let exif: Record<string, any> = {};
    try {
      // translateValues stays off: we want the same raw values on read as
      // we write back on save, rather than a human-readable string that
      // wouldn't round-trip (e.g. Orientation as "Horizontal (normal)").
      exif = (await exifr.parse(file, {
        tiff: true, exif: true, gps: true, iptc: true, xmp: true, icc: false, translateValues: false,
      })) || {};
    } catch {
      exif = {};
    }

    const editableIf = (key: string) => isJpeg && isWritableTag(key);
    const { width, height } = await readPixelSize(file);

    const overview: MetadataField[] = [
      { key: "dimensions", label: "Dimensions", value: width && height ? `${width} × ${height} px` : "—", kind: "readonly", editable: false, hint: "Derived from the actual pixel data, not a tag — not editable" },
      { key: "type", label: "File type", value: file.type || "unknown", kind: "readonly", editable: false },
    ];

    const origin: MetadataField[] = [
      { key: "Artist", label: "Author / Artist", value: exif.Artist ?? null, kind: "text", editable: editableIf("Artist") },
      { key: "Copyright", label: "Copyright", value: exif.Copyright ?? null, kind: "text", editable: editableIf("Copyright") },
      { key: "ImageDescription", label: "Description", value: exif.ImageDescription ?? null, kind: "text", editable: editableIf("ImageDescription") },
      { key: "Software", label: "Software used", value: exif.Software ?? null, kind: "text", editable: editableIf("Software") },
    ];

    const timestamps: MetadataField[] = [
      { key: "DateTimeOriginal", label: "Date taken", value: exif.DateTimeOriginal ? formatDate(exif.DateTimeOriginal) : null, kind: "date", editable: editableIf("DateTimeOriginal"), hint: "EXIF DateTimeOriginal — format: YYYY:MM:DD HH:MM:SS" },
      { key: "CreateDate", label: "Date created", value: exif.CreateDate ? formatDate(exif.CreateDate) : null, kind: "date", editable: editableIf("CreateDate"), hint: "Format: YYYY:MM:DD HH:MM:SS" },
      { key: "ModifyDate", label: "Date modified", value: exif.ModifyDate ? formatDate(exif.ModifyDate) : null, kind: "date", editable: editableIf("ModifyDate"), hint: "Format: YYYY:MM:DD HH:MM:SS" },
    ];

    const location: MetadataField[] = [
      { key: "gps.lat", label: "Latitude", value: exif.latitude ?? null, kind: "number", editable: isJpeg, hint: "Decimal degrees" },
      { key: "gps.lon", label: "Longitude", value: exif.longitude ?? null, kind: "number", editable: isJpeg, hint: "Decimal degrees" },
      { key: "GPSAltitude", label: "Altitude", value: exif.GPSAltitude ?? null, kind: "number", editable: isJpeg, hint: "Meters — negative for below sea level" },
    ];

    const technical: MetadataField[] = [
      { key: "Make", label: "Camera make", value: exif.Make ?? null, kind: "text", editable: editableIf("Make") },
      { key: "Model", label: "Camera model", value: exif.Model ?? null, kind: "text", editable: editableIf("Model") },
      { key: "LensModel", label: "Lens", value: exif.LensModel ?? null, kind: "text", editable: editableIf("LensModel") },
      { key: "ExposureTime", label: "Exposure time", value: exif.ExposureTime ?? null, kind: "number", editable: editableIf("ExposureTime"), hint: "Seconds, e.g. 0.008 for 1/125s" },
      { key: "FNumber", label: "Aperture", value: exif.FNumber ?? null, kind: "number", editable: editableIf("FNumber"), hint: "f-stop, e.g. 2.8" },
      { key: "ISO", label: "ISO", value: exif.ISO ?? null, kind: "number", editable: editableIf("ISO") },
      { key: "FocalLength", label: "Focal length", value: exif.FocalLength ?? null, kind: "number", editable: editableIf("FocalLength"), hint: "Millimeters" },
      { key: "Orientation", label: "Orientation", value: exif.Orientation ?? null, kind: "number", editable: editableIf("Orientation"), hint: "1=normal, 3=180°, 6=90° CW, 8=90° CCW" },
      { key: "ColorSpace", label: "Color space", value: exif.ColorSpace ?? null, kind: "number", editable: editableIf("ColorSpace"), hint: "1=sRGB, 65535=uncalibrated" },
    ];

    const hiddenEntries = Object.entries(exif).filter(
      ([k, v]) => !CONSUMED_KEYS.has(k) && v != null && typeof v !== "object"
    );
    const hidden: MetadataField[] = hiddenEntries.map(([k, v]) => ({
      key: `raw.${k}`,
      label: k,
      value: String(v),
      kind: "text",
      editable: editableIf(k),
      hint: editableIf(k)
        ? "Standard EXIF tag"
        : "Not part of the standard EXIF/TIFF tag set (likely XMP or IPTC data) — can't be written back here",
    }));

    return {
      category: "image",
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      write: isJpeg
        ? { supported: true }
        : { supported: false, reason: "Writing metadata is currently supported for JPEG only. You can still view everything found in this file." },
      groups: [
        { id: "overview", tag: "overview", title: "Overview", fields: overview },
        { id: "origin", tag: "origin", title: "Origin & authorship", fields: origin },
        { id: "timestamps", tag: "time", title: "Timestamps", fields: timestamps },
        { id: "location", tag: "geo", title: "Location", fields: location },
        { id: "technical", tag: "technical", title: "Camera & technical", fields: technical },
        ...(hidden.length
          ? [{ id: "hidden", tag: "raw", title: `Hidden & raw tags (${hidden.length})`, fields: hidden }]
          : []),
      ],
    };
  },

  async write(file: File, edits: EditedValue[]): Promise<Blob> {
    if (!WRITABLE_JPEG_TYPES.includes(file.type)) {
      throw new Error("Writing metadata is only supported for JPEG images.");
    }
    const dataUrl = await fileToDataURL(file);
    const exifObj = piexif.load(dataUrl);
    exifObj["0th"] = exifObj["0th"] || {};
    exifObj.Exif = exifObj.Exif || {};
    exifObj.GPS = exifObj.GPS || {};

    const map: Record<string, string> = Object.fromEntries(edits.map((e) => [e.key, e.value]));

    // GPS lat/lon travel together (need matching hemisphere refs), so handle them as a pair.
    if (map["gps.lat"] !== undefined && map["gps.lon"] !== undefined) {
      const lat = parseFloat(map["gps.lat"]);
      const lon = parseFloat(map["gps.lon"]);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? "N" : "S";
        exifObj.GPS[piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lat));
        exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef] = lon >= 0 ? "E" : "W";
        exifObj.GPS[piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lon));
      }
    }
    if (map.GPSAltitude !== undefined) {
      const alt = parseFloat(map.GPSAltitude);
      if (!Number.isNaN(alt)) {
        exifObj.GPS[piexif.GPSIFD.GPSAltitudeRef] = alt < 0 ? 1 : 0;
        exifObj.GPS[piexif.GPSIFD.GPSAltitude] = toRational(Math.abs(alt));
      }
    }

    // Everything else: look up its real EXIF tag and encode per that tag's type.
    for (const [key, value] of Object.entries(map)) {
      if (key === "gps.lat" || key === "gps.lon" || key === "GPSAltitude") continue;
      const exifrKey = key.startsWith("raw.") ? key.slice(4) : key;
      const info = resolveTag(exifrKey);
      if (!info || UNSAFE_TAG_TYPES.has(info.type)) continue;
      (exifObj as any)[info.ifd][info.tag] = encodeForType(info.type, value);
    }

    const exifBytes = piexif.dump(exifObj);
    const newDataUrl = piexif.insert(exifBytes, dataUrl);
    return dataURLToBlob(newDataUrl, file.type);
  },
};
