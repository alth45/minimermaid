import type { Direction, EdgeSpec, NodeSpec, ParseResult } from './types';
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

/**
 * Direktif arah pada baris pertama (sebelum node mana pun):
 *   `[horizontal]` atau `[horizontal] flowchart LR` → layout kiri→kanan
 *   `[vertical]` / `[vertikal]`                    → layout atas→bawah (default)
 */
const DIRECTION_PATTERN =
  /^\[\s*(horizontal|horiz|lr|vert(?:ical|ikal)?|tb)\s*\](?:\s+.*$|$)/i;

/** Selesaikan token direktif arah menjadi nilai kanonik. */
function resolveDirection(token: string): Direction | undefined {
  const t = token.trim().toLowerCase();
  if (t === 'horizontal' || t === 'horiz' || t === 'lr') return 'horizontal';
  if (t === 'vertical' || t === 'vertikal' || t === 'tb') return 'vertical';
  return undefined;
}

/** Parse sumber teks menjadi model node + edge + error + arah. */
export function parse(source: string): ParseResult {
  const nodes: NodeSpec[] = [];
  const edges: EdgeSpec[] = [];
  const errors: string[] = [];
  let direction: Direction = 'vertical';
  let directiveSeen = false;

  source.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    // Abaikan baris kosong & komentar.
    if (line === '' || line.startsWith('#') || line.startsWith('//')) return;

    // Periksa direktif arah — hanya valid di baris-baris awal,
    // sebelum node pertama ditemukan.
    if (!directiveSeen && nodes.length === 0) {
      const dirMatch = DIRECTION_PATTERN.exec(line);
      const dirToken = dirMatch?.[1];
      if (dirMatch) {
        directiveSeen = true;
        if (dirToken !== undefined) {
          const resolved = resolveDirection(dirToken);
          if (resolved) direction = resolved;
        }
        return;
      }
    }

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

  return { nodes, edges, errors, direction };
}
