import React, { useCallback, useMemo, useState } from "react";
import {
  UploadZone,
  MetadataPanel,
  Header,
  parseFile,
  writeFile,
  type ParsedMetadata,
  type SaveMode,
} from "@deeptag/shared";
import { downloadBlob, copyFileName, saveInPlace } from "./lib/saveHandlers";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [handle, setHandle] = useState<any | null>(null);
  const [meta, setMeta] = useState<ParsedMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (f: File, h?: any) => {
    setLoading(true);
    setError(null);
    setNote(null);
    setFile(f);
    setHandle(h ?? null);
    try {
      const parsed = await parseFile(f);
      setMeta(parsed);
      setValues({});
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read this file.");
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setHandle(null);
    setMeta(null);
    setValues({});
    setEditing(false);
    setNote(null);
    setError(null);
  }, []);

  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const hasChanges = useMemo(() => {
    if (!meta) return false;
    const allFields = meta.groups.flatMap((g) => g.fields);
    return Object.entries(values).some(([key, v]) => {
      const field = allFields.find((f) => f.key === key);
      if (!field?.editable) return false;
      const original = field.value != null ? String(field.value) : "";
      return v !== original;
    });
  }, [values, meta]);

  const handleSave = useCallback(
    async (mode: SaveMode) => {
      if (!file || !meta) return;
      setBusy(true);
      setNote(null);
      setError(null);
      try {
        const edits = Object.entries(values).map(([key, value]) => ({ key, value }));
        const blob = await writeFile(file, edits);

        if (mode === "copy") {
          downloadBlob(blob, copyFileName(file.name));
          setNote("Saved as a new file in your downloads folder. The original is untouched.");
          setEditing(false);
          setValues({});
          return;
        }

        const wroteInPlace = await saveInPlace(handle, blob, file.name);
        setNote(
          wroteInPlace
            ? "Saved back to the original file."
            : "Your browser can't overwrite the original file directly, so a replacement was downloaded instead. Chrome or Edge on desktop can save in place."
        );
        const updatedFile = new File([blob], file.name, { type: file.type, lastModified: Date.now() });
        setFile(updatedFile);
        const refreshed = await parseFile(updatedFile);
        setMeta(refreshed);
        setValues({});
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save changes.");
      } finally {
        setBusy(false);
      }
    },
    [file, meta, values, handle]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        right={
          <a
            href="#desktop-app"
            className="rounded-[var(--dt-radius-sm)] border border-[var(--dt-border-strong)] px-3.5 py-2 text-sm text-[var(--dt-text-secondary)] transition-colors hover:border-[var(--dt-accent)] hover:text-[var(--dt-accent)]"
          >
            Get the desktop app
          </a>
        }
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-12 sm:px-10 sm:py-16 lg:px-16 xl:px-20">
        {!meta && (
          <div className="mb-10 text-center">
            <h1 className="font-[var(--dt-font-display)] text-3xl font-semibold tracking-tight text-[var(--dt-text-primary)] sm:text-4xl">
              See what your files are really carrying
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[var(--dt-text-secondary)]">
              Name, date, author, and location are only the start. DeepTag reads the deeper tags too —
              camera settings, GPS coordinates, document revision history, ID3 frames — and lets you edit
              what the format allows. Everything runs on your device; nothing is uploaded anywhere.
            </p>
          </div>
        )}

        {!meta ? (
          <UploadZone onFile={handleFile} isLoading={loading} tryFileSystemAccess />
        ) : (
          <MetadataPanel
            meta={meta}
            editing={editing}
            values={values}
            hasChanges={hasChanges}
            busy={busy}
            onChange={handleChange}
            onStartEdit={() => setEditing(true)}
            onCancelEdit={() => {
              setEditing(false);
              setValues({});
            }}
            onSave={handleSave}
            onReset={handleReset}
          />
        )}

        {error && (
          <p className="mt-4 rounded-[var(--dt-radius-sm)] border border-[var(--dt-danger)]/40 bg-[var(--dt-danger-soft)] px-4 py-3 text-sm text-[var(--dt-danger)]">
            {error}
          </p>
        )}
        {note && !error && (
          <p className="mt-4 rounded-[var(--dt-radius-sm)] border border-[var(--dt-data)]/40 bg-[var(--dt-data-soft)] px-4 py-3 text-sm text-[var(--dt-data)]">
            {note}
          </p>
        )}
      </main>

      <section id="desktop-app" className="border-t border-[var(--dt-border)] px-6 py-14 sm:px-10">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-[var(--dt-font-mono)] text-xs text-[var(--dt-accent)]">// portable</p>
            <h2 className="mt-1 font-[var(--dt-font-display)] text-xl font-medium text-[var(--dt-text-primary)]">
              Prefer to work offline? Grab the desktop app.
            </h2>
            <p className="mt-2 max-w-md text-sm text-[var(--dt-text-secondary)]">
              Same interface, same engine, running fully on your machine. No install required —
              it's a single portable executable.
            </p>
          </div>
          <a
            href="https://github.com/your-org/deeptag/releases/latest"
            className="shrink-0 rounded-[var(--dt-radius-sm)] bg-[var(--dt-accent)] px-5 py-2.5 text-sm font-medium text-[#1A1206] transition hover:brightness-110"
          >
            Download for desktop
          </a>
        </div>
      </section>

      <footer className="border-t border-[var(--dt-border)] px-6 py-6 text-center text-xs text-[var(--dt-text-muted)] sm:px-10">
        DeepTag reads and writes files entirely in your browser. Nothing you open here is uploaded to a server.
      </footer>
    </div>
  );
}
