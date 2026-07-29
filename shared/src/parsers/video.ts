import MP4Box from "mp4box";
import type { MetadataField, Parser, ParsedMetadata } from "../types";
import { formatBytes, formatDate, formatDuration, extensionOf } from "../utils/format";

function readInfo(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const mp4boxfile = MP4Box.createFile();
    mp4boxfile.onReady = (info: any) => resolve(info);
    mp4boxfile.onError = (err: string) => reject(new Error(err));

    file
      .arrayBuffer()
      .then((buffer: ArrayBuffer) => {
        (buffer as any).fileStart = 0;
        mp4boxfile.appendBuffer(buffer);
        mp4boxfile.flush();
      })
      .catch(reject);
  });
}

export const videoParser: Parser = {
  category: "video",
  matches: (file) =>
    file.type.startsWith("video/") || ["mp4", "mov", "m4v", "3gp"].includes(extensionOf(file.name)),

  async parse(file: File): Promise<ParsedMetadata> {
    let info: any = null;
    try {
      info = await readInfo(file);
    } catch {
      info = null;
    }

    if (!info) {
      return {
        category: "video",
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        write: { supported: false, reason: "This video's container couldn't be parsed (it may not be MP4/MOV-based)." },
        groups: [
          {
            id: "overview", tag: "overview", title: "Overview",
            fields: [
              { key: "size", label: "Size", value: formatBytes(file.size), kind: "readonly", editable: false },
              { key: "type", label: "Reported type", value: file.type || "unknown", kind: "readonly", editable: false },
            ],
          },
        ],
      };
    }

    const videoTrack = info.videoTracks?.[0];
    const audioTrack = info.audioTracks?.[0];

    const overview: MetadataField[] = [
      { key: "duration", label: "Duration", value: formatDuration(info.duration / info.timescale), kind: "readonly", editable: false },
      { key: "size", label: "Size", value: formatBytes(file.size), kind: "readonly", editable: false },
      { key: "brand", label: "Major brand", value: info.brands?.[0] ?? null, kind: "readonly", editable: false },
      { key: "fragmented", label: "Fragmented", value: info.isFragmented ? "Yes" : "No", kind: "readonly", editable: false },
    ];

    const timestamps: MetadataField[] = [
      { key: "created", label: "Created", value: info.created ? formatDate(info.created) : null, kind: "readonly", editable: false },
      { key: "modified", label: "Modified", value: info.modified ? formatDate(info.modified) : null, kind: "readonly", editable: false },
    ];

    const technical: MetadataField[] = [
      { key: "videoCodec", label: "Video codec", value: videoTrack?.codec ?? null, kind: "readonly", editable: false },
      { key: "resolution", label: "Resolution", value: videoTrack ? `${videoTrack.track_width} × ${videoTrack.track_height}` : null, kind: "readonly", editable: false },
      { key: "audioCodec", label: "Audio codec", value: audioTrack?.codec ?? null, kind: "readonly", editable: false },
      { key: "sampleRate", label: "Audio sample rate", value: audioTrack?.audio?.sample_rate ? `${audioTrack.audio.sample_rate} Hz` : null, kind: "readonly", editable: false },
      { key: "trackCount", label: "Total tracks", value: info.tracks?.length ?? null, kind: "readonly", editable: false },
    ];

    return {
      category: "video",
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      write: {
        supported: false,
        reason: "Editing video metadata safely requires rebuilding the container and isn't supported yet — this is on the roadmap. Everything found in the file is still shown below.",
      },
      groups: [
        { id: "overview", tag: "overview", title: "Overview", fields: overview },
        { id: "timestamps", tag: "time", title: "Timestamps", fields: timestamps },
        { id: "technical", tag: "technical", title: "Tracks & codecs", fields: technical },
      ],
    };
  },
};
