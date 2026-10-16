import type { EdgeSpec, NodeSpec, ParseResult } from './types';
import { resolveShape } from './shapes';

/* =========================================================
   PARSER — teks → model diagram.
   Murni fungsi: tanpa DOM, tanpa mutasi keadaan global.
   Error dikumpulkan sebagai array string (bukan exception)
   supaya UI bisa menampilkan semua masalah sekaligus.
   ========================================================= */

/**
 * Grambar satu baris:
 *   `->[shape]->text["Label"]->node`
 * Bagian `text|label|txt` dan `->node` bersifat opsional.
 */
const LINE_PATTERN =
  /^->\s*\[\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]\s*->\s*(?:text|label|txt)?\s*\[\s*"([^"]*)"\s*\]\s*(->\s*node)?\s*$/;

/** Parse sumber teks menjadi model node + edge + error. */
export function parse(source: string): ParseResult {
  const nodes: NodeSpec[] = [];
  const edges: EdgeSpec[] = [];
  const errors: string[] = [];

  source.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    // Abaikan baris kosong & komentar.
    if (line === '' || line.startsWith('#') || line.startsWith('//')) return;

    const match = LINE_PATTERN.exec(line);
    const shapeToken = match?.[1];
    const labelToken = match?.[2];
    if (!match || shapeToken === undefined || labelToken === undefined) {
      errors.push(`Baris ${index + 1}: sintaks tidak dikenal → ${line}`);
      return;
    }

    let shape = resolveShape(shapeToken);
    if (shape === undefined) {
      errors.push(`Baris ${index + 1}: bentuk "${shapeToken.toLowerCase()}" tidak dikenal, dipakai 'square'.`);
      shape = 'square';
    }

    nodes.push({
      shape,
      // Dukung eskap `\n` literal di dalam label menjadi baris baru.
      label: labelToken.replace(/\\n/g, '\n'),
      link: match[3] !== undefined,
    });
  });

  // Bangun edge: node bertanda `->node` menyambung ke node berikutnya.
  for (let i = 0; i < nodes.length - 1; i++) {
    if (nodes[i]?.link) edges.push({ from: i, to: i + 1 });
  }
  const last = nodes[nodes.length - 1];
  if (last?.link) {
    errors.push('Node terakhir memakai "->node" tetapi tidak ada node berikutnya.');
  }

  return { nodes, edges, errors };
}
