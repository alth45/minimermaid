import type { Direction, EdgeSpec, NodeSpec, ParseResult } from './types';
import { resolveBranchRole, resolveShape, type BranchRole } from './shapes';

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
 * Satu segmen node dalam sebuah baris: `[bentuk] -> text["Label"]` (opsional `->node`).
 * Dipakai untuk memecah baris menjadi beberapa node (mendukung percabangan satu baris).
 */
const SEGMENT_PATTERN = String.raw`\[\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]\s*->\s*(?:text|label|txt)?\s*\[\s*"([^"]*)"\s*\]\s*(?:->\s*node\s*)?`;

/** Baris tunggal yang terdiri dari beberapa segmen node, dipisah `->`. */
const MULTINODE_LINE_PATTERN = new RegExp(
  String.raw`^(?:->\s*)?(` + SEGMENT_PATTERN + String.raw`(?:->\s*)?)+$`,
);

/** Pemisah antar-segmen pada baris multi-node. */
const SEGMENT_SPLIT_PATTERN = new RegExp(String.raw`->\s*(?=\[)`);

/**
 * Sintaks lama dua-baris masih didukung:
 *   `[cabang]->[shape]->text["Label"]`          → sumber saja (sisi di baris berikutnya)
 *   `[cabang]->[shape]->text["Label"]->node`    → sumber + sisi ya/tidak ditulis inline
 *   `->ya["..."]` / `->tidak["..."]`            → sisi tanpa bentuk eksplisit
 */
const BRANCH_MARKER_PATTERN = /^\[(cabang|branch|if)\]/i;

function legacyBranchLinePattern(marker: string): RegExp {
  return new RegExp(
    String.raw`^\[` + marker + String.raw`\]\s*->\s*\[\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]\s*->\s*` +
      String.raw`(?:text|label|txt)?\s*\[\s*"([^"]*)"\s*\]` +
      // Bentuk lama: `->node` WAJIB ada sebelum sisi ya/tidak boleh muncul.
      String.raw`(->\s*node\s*)?` +
      // Sisi "ya" (opsional): ->node  ATAU  ->ya["..."]->node
      String.raw`(?:->\s*(?:ya|yes)\s*(?:\[\s*"([^"]*)"\s*\])?\s*->\s*node\s*)?` +
      // Sisi "tidak" (opsional): ->node  ATAU  ->tidak["..."]->node
      String.raw`(?:->\s*(?:tidak|no)\s*(?:\[\s*"([^"]*)"\s*\])?\s*->\s*node\s*)?$`,
    'i',
  );
}

/** Sisi cabang gaya lama: `->ya["..."]` / `->tidak["..."]` (boleh tanpa label). */
const LEGACY_SIDE_PATTERN =
  /^->\s*(ya|yes|tidak|no)\s*(?:\[\s*"([^"]*)"\s*\])?\s*(?:->\s*node)?\s*$/i;

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

  /** Tambah satu node; `branchRole` 'source' memberi flag cabang. */
  const pushNode = (
    shapeTokenRaw: string,
    labelToken: string,
    link: boolean,
    branchRole?: BranchRole,
  ): void => {
    let shape = resolveShape(shapeTokenRaw);
    if (shape === undefined) {
      errors.push(`Bentuk "${shapeTokenRaw.trim().toLowerCase()}" tidak dikenal, dipakai 'square'.`);
      shape = 'square';
    }
    nodes.push({
      shape,
      // Dukung eskap `\n` literal di dalam label menjadi baris baru.
      label: labelToken.replace(/\\n/g, '\n'),
      link,
      branch: branchRole === 'source',
    });
    rawBranches.push(undefined);
  };

  /** Ambil bentuk & label dari satu segmen `[bentuk] -> text["label"]`. */
  const SEGMENT_EXTRACT = new RegExp(
    String.raw`^\s*\[?\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]\s*->\s*(?:text|label|txt)?\s*\[\s*"([^"]*)"\s*\]\s*(?:->\s*node\s*)?$`,
  );

  /** Pecah baris multi-node menjadi daftar segmen (null bila tak cocok). */
  const segmentsOf = (text: string): { shape: string; label: string }[] | null => {
    const parts = text.split(SEGMENT_SPLIT_PATTERN);
    const out: { shape: string; label: string }[] = [];
    for (const part of parts) {
      const p = part.trim().replace(/^->\s*/, '');
      const m = SEGMENT_EXTRACT.exec(p.startsWith('[') ? p : `[${p}`);
      if (!m || m[1] === undefined || m[2] === undefined) return null;
      out.push({ shape: m[1], label: m[2] });
    }
    return out.length >= 2 ? out : null;
  };

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

    // --- Baris PERCABANGAN `[cabang]` (gaya lama maupun satu baris penuh) ---
    const markerMatch = BRANCH_MARKER_PATTERN.exec(line);
    const markerToken = markerMatch?.[1];
    if (markerMatch && markerToken !== undefined) {
      // 1) Gaya lama: sumber + sisi inline `->ya["..."]` / `->tidak["..."]`.
      const legacy = legacyBranchLinePattern(markerToken).exec(line);
      const legacyShape = legacy?.[1];
      const legacyLabel = legacy?.[2];
      if (legacy && legacyShape !== undefined && legacyLabel !== undefined) {
        pushNode(legacyShape, legacyLabel, legacy[3] !== undefined, 'source');
        rawBranches[nodes.length - 1] = { yesLabel: legacy[4], noLabel: legacy[5] };
        return;
      }
      // 2) Gaya satu baris penuh:
      //    `[cabang]->[diamond]->text["Login?"]->node->[ya]->text["OK"]->node->[tidak]->text["Gagal"]`
      //    Sumber WAJIB disertai kedua sisi ([ya] dan [tidak]) pada baris yang
      //    sama â€” percabangan hanya terbentuk bila kata `[cabang]` memang ditulis.
      const tail = line.slice(markerMatch[0].length).replace(/^\s*->\s*/, '');
      const segs = segmentsOf(tail);
      if (segs && segs.length >= 3) {
        const roles = segs.map((sg) => resolveBranchRole(sg.shape));
        const yesAt = roles.findIndex((r) => r === 'yes');
        const noAt = roles.findIndex((r) => r === 'no');
        const srcSeg = segs[0];
        const yesSeg = yesAt >= 0 ? segs[yesAt] : undefined;
        const noSeg = noAt >= 0 ? segs[noAt] : undefined;
        if (srcSeg && yesSeg && noSeg && yesAt < noAt) {
          pushNode(srcSeg.shape, srcSeg.label, true, 'source');
          rawBranches[nodes.length - 1] = {
            // Sisi bergaya lama (`ya["Label"]` tanpa bentuk dikenal) -> label edge kustom.
            yesLabel: resolveShape(yesSeg.shape) === undefined ? yesSeg.label : undefined,
            noLabel: resolveShape(noSeg.shape) === undefined ? noSeg.label : undefined,
          };
          pushNode(yesSeg.shape, yesSeg.label, false, 'yes');
          pushNode(noSeg.shape, noSeg.label, noAt + 1 < segs.length, 'no');
          // Segmen sesudah sisi "tidak" melanjutkan rantai linear biasa.
          for (let sg = noAt + 1; sg < segs.length; sg++) {
            const seg = segs[sg];
            if (seg) pushNode(seg.shape, seg.label, sg < segs.length - 1);
          }
          return;
        }
      }
      errors.push(`Baris ${index + 1}: sintaks cabang tidak dikenal → ${line}`);
      return;
    }

    // --- Baris MULTI-NODE (rantai linear satu baris, TANPA kata cabang) ---
    // Contoh: `->[square]->text["A"]->node->[round]->text["B"]`
    // Catatan: token `[cabang]/[ya]/[tidak]` di sini tetap dikenali sebagai
    // peran cabang, tetapi panah bercabang hanya terbentuk dari blok `[cabang]`.
    if (MULTINODE_LINE_PATTERN.test(line)) {
      const segs = segmentsOf(line);
      if (segs) {
        segs.forEach((s, i) => {
          pushNode(s.shape, s.label, i < segs.length - 1, resolveBranchRole(s.shape));
        });
        return;
      }
    }

    // --- Baris node biasa (satu node) ---
    const match = LINE_PATTERN.exec(line);
    const shapeToken = match?.[1];
    const labelToken = match?.[2];
    if (!match || shapeToken === undefined || labelToken === undefined) {
      // --- Sisi cabang gaya lama tanpa bentuk: `->ya["Ya"]->node` ---
      const sideMatch = LEGACY_SIDE_PATTERN.exec(line);
      const sideWord = sideMatch?.[1];
      if (sideMatch && sideWord !== undefined) {
        const isYes = sideWord.toLowerCase().startsWith('y');
        const sideLabel = sideMatch[2] ?? (isYes ? DEFAULT_BRANCH_LABELS.yes : DEFAULT_BRANCH_LABELS.no);
        pushNode(isYes ? 'round' : 'diamond', sideLabel, sideMatch[3] !== undefined);
        return;
      }
      errors.push(`Baris ${index + 1}: sintaks tidak dikenal → ${line}`);
      return;
    }
    pushNode(shapeToken, labelToken, match[3] !== undefined, resolveBranchRole(shapeToken));
  });

  // Bangun edge. Node bertanda `->node` menyambung ke node berikutnya;
  // node cabang menghasilkan DUA edge berlabel ("Ya"/"Tidak") yang menunjuk
  // ke dua node berikutnya (sisi ya lalu sisi tidak).
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;
    if (node.branch) {
      const info = rawBranches[i];
      const yesIdx = i + 1;
      const noIdx = i + 2;
      if (yesIdx < nodes.length) {
        edges.push({ from: i, to: yesIdx, label: info?.yesLabel ?? DEFAULT_BRANCH_LABELS.yes });
      }
      if (noIdx < nodes.length) {
        edges.push({ from: i, to: noIdx, label: info?.noLabel ?? DEFAULT_BRANCH_LABELS.no });
      }
      continue;
    }
    const next = nodes[i + 1];
    if (node.link && next) edges.push({ from: i, to: i + 1 });
  }
  const last = nodes[nodes.length - 1];
  if (last?.link) {
    errors.push('Node terakhir memakai "->node" tetapi tidak ada node berikutnya.');
  }

  return { nodes, edges, errors, direction };
}
