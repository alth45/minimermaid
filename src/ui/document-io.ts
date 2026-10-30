/* =========================================================
   DOCUMENT IO (UI layer) — file picker, download, drag & drop.
   ========================================================= */

import type { MiniMermaidDocument } from '../core/types';
import { serializeDocument } from '../core/document';

export function downloadDocument(doc: MiniMermaidDocument, filename = 'diagram.mmd.json'): void {
  const json = serializeDocument(doc);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Buka file picker, kembalikan isi file (atau null jika batal). */
export function pickJsonFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.mmd.json,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try { resolve(await file.text()); }
      catch { resolve(null); }
    };
    input.click();
  });
}

/** Baca file dari `DataTransfer` (untuk drag & drop). */
export async function readDroppedFile(file: File): Promise<string | null> {
  try { return await file.text(); }
  catch { return null; }
}