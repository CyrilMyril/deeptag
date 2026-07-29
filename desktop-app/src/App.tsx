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
import { saveAsCopy, saveInPlace, copyFileName } from "./lib/saveHandlers";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [meta, setMeta] = useState<ParsedMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (f: File) => {
    setLoading(true);
    setError(null);
    setNote(null);
    setFile(f);
    try {
      setFilePath(window.electronAPI?.getPathForFile ? window.electronAPI.getPathForFile(f) : null);
    } catch {
      setFilePath(null);
    }
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
    setFilePath(null);
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
          const savedPath = await saveAsCopy(blob, copyFileName(file.name));
          setNote(savedPath ? `Saved a copy to ${savedPath}` : null);
          setEditing(false);
          setValues({});
          return;
        }

        if (!filePath) {
          setError("Couldn't determine this file's location on disk, so it can't be saved in place. Try 'Save as copy' instead.");
          return;
        }
        const ok = await saveInPlace(blob, filePath);
        if (!ok) {
          setError("Couldn't write to the original file.");
          return;
        }
        setNote("Saved back to the original file.");
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
    [file, meta, values, filePath]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-10 sm:px-10 sm:py-14 lg:px-16 xl:px-20">
        {!meta && (
          <div className="mb-10 text-center">
            <h1 className="font-[var(--dt-font-display)] text-2xl font-semibold tracking-tight text-[var(--dt-text-primary)] sm:text-3xl">
              See what your files are really carrying
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[var(--dt-text-secondary)]">
              Everything runs locally on this machine — files never leave your device.
            </p>
          </div>
        )}

        {!meta ? (
          <UploadZone onFile={handleFile} isLoading={loading} helperText="or click to browse" />
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
    </div>
  );
}
