import type { Direction, EdgeSpec, NodeSpec, ParseResult } from './types';
import { resolveShape } from './shapes';

/* =========================================================
   PARSER — teks → model diagram.
   Murni fungsi: tanpa DOM, tanpa mutasi keadaan global.
   Error dikumpulkan sebagai array string (bukan exception)
   supaya UI bisa menampilkan semua masalah sekaligus.
   ========================================================= */

/**
 * Grambar satu baris node biasa:
 *   `->[shape]->text["Label"]->node`
 * Bagian `text|label|txt` dan `->node` bersifat opsional.
 */
const LINE_PATTERN =
  /^->\s*\[\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]\s*->\s*(?:text|label|txt)?\s*\[\s*"([^"]*)"\s*\]\s*(->\s*node)?\s*$/;

/**
 * Grambar satu baris PERCABANGAN (cabang):
 *   `[cabang]->[shape]->text["Label"]->node`
 * Diakhiri dua sisi cabang, masing-masing opsional berlabel:
 *   `->ya["Ya"]->node` / `->tidak["Tidak"]->node` / `->node` (tanpa label)
 * Alias penanda: `[branch]`, `[if]`. Alias sisi: yes/ya, no/tidak.
 */
const BRANCH_MARKER_PATTERN = /^\[(cabang|branch|if)\]/i;

function branchLinePattern(marker: string): RegExp {
  return new RegExp(
    String.raw`^\[` + marker + String.raw`\]\s*->\s*\[\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]\s*->\s*` +
      String.raw`(?:text|label|txt)?\s*\[\s*"([^"]*)"\s*\]\s*->\s*node\s*` +
      // Sisi "ya" (opsional): ->node  ATAU  ->ya["..."]->node
      String.raw`(?:->\s*(?:ya|yes)\s*(?:\[\s*"([^"]*)"\s*\])?\s*->\s*node\s*)?` +
      // Sisi "tidak" (opsional): ->node  ATAU  ->tidak["..."]->node
      String.raw`(?:->\s*(?:tidak|no)\s*(?:\[\s*"([^"]*)"\s*\])?\s*->\s*node\s*)?$`,
    'i',
  );
}

/** Label bawaan untuk kedua sisi percabangan. */
const DEFAULT_BRANCH_LABELS = { yes: 'Ya', no: 'Tidak' } as const;

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

  /** Info percabangan mentah per baris (indeks sejajar dengan `nodes`). */
  interface RawBranch {
    readonly yesLabel?: string;
    readonly noLabel?: string;
  }
  const rawBranches: (RawBranch | undefined)[] = [];

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

    // --- Baris PERCABANGAN? ---
    const markerMatch = BRANCH_MARKER_PATTERN.exec(line);
    const markerToken = markerMatch?.[1];
    if (markerMatch && markerToken !== undefined) {
      const match = branchLinePattern(markerToken).exec(line);
      const shapeToken = match?.[1];
      const labelToken = match?.[2];
      if (!match || shapeToken === undefined || labelToken === undefined) {
        errors.push(`Baris ${index + 1}: sintaks cabang tidak dikenal → ${line}`);
        return;
      }
      let shape = resolveShape(shapeToken);
      if (shape === undefined) {
        errors.push(`Baris ${index + 1}: bentuk "${shapeToken.toLowerCase()}" tidak dikenal, dipakai 'square'.`);
        shape = 'square';
      }
      nodes.push({
        shape,
        label: labelToken.replace(/\\n/g, '\n'),
        link: true, // cabang selalu menyambung ke node berikutnya
        branch: true,
      });
      rawBranches.push({ yesLabel: match[3], noLabel: match[4] });
      return;
    }

    // --- Baris node biasa ---
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
      branch: false,
    });
    rawBranches.push(undefined);
  });

  // Bangun edge. Node bertanda `->node` menyambung ke node berikutnya;
  // node cabang menghasilkan DUA edge berlabel ("Ya"/"Tidak") yang sama-sama
  // menunjuk ke node berikutnya.
  for (let i = 0; i < nodes.length - 1; i++) {
    const node = nodes[i];
    const next = nodes[i + 1];
    if (!node || !next) continue;
    if (node.branch) {
      const info = rawBranches[i];
      edges.push({ from: i, to: i + 1, label: info?.yesLabel ?? DEFAULT_BRANCH_LABELS.yes });
      edges.push({ from: i, to: i + 1, label: info?.noLabel ?? DEFAULT_BRANCH_LABELS.no });
    } else if (node.link) {
      edges.push({ from: i, to: i + 1 });
    }
  }
  const last = nodes[nodes.length - 1];
  if (last?.link) {
    errors.push('Node terakhir memakai "->node" tetapi tidak ada node berikutnya.');
  }

  return { nodes, edges, errors, direction };
}
