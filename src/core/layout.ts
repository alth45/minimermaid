import type { DiagramGeometry, Direction, EdgeSpec, NodeSpec, PositionedNode, ShapeKind } from './types';
import { LAYOUT } from './config';

/* =========================================================
   LAYOUT — mengukur & menempatkan node, secara vertikal
   (atas→bawah) atau horizontal (kiri→kanan).
   Setiap bentuk punya aturan minimum ukuran sendiri supaya
   teks tidak terpotong dan bentuk tetap proporsional.
   ========================================================= */

/** Node yang sudah diukur tapi belum ditempatkan (tanpa x/y). */
type MeasuredNode = Omit<PositionedNode, 'x' | 'y'>;

/** Hitung jumlah baris & dimensi teks kasar dari label. */
function measureText(label: string): { textW: number; textH: number; lines: string[] } {
  const lines = label.split('\n');
  const longest = Math.max(1, ...lines.map((l) => l.length));
  return {
    textW: longest * LAYOUT.charWidth,
    textH: lines.length * LAYOUT.lineHeight,
    lines,
  };
}

/** Ukuran dasar yang dipakai bentuk-bentuk sederhana. */
function baseSize(textW: number, textH: number): { w: number; h: number } {
  return {
    w: Math.max(LAYOUT.minW, textW + LAYOUT.padX),
    h: Math.max(LAYOUT.minH, textH + LAYOUT.padY),
  };
}

/** Aturan minimum ukuran per bentuk (override atas ukuran dasar). */
function sizeForShape(shape: ShapeKind, textW: number, textH: number): { w: number; h: number } {
  const base = baseSize(textW, textH);
  switch (shape) {
    case 'triangle':
      return { w: Math.max(130, textW + 70), h: Math.max(94, textH + 56) };
    case 'diamond':
      return { w: Math.max(150, textW * 1.7 + LAYOUT.padX), h: Math.max(96, textH + 58) };
    case 'circle':
    case 'ellipse':
      return { w: Math.max(124, textW + 56), h: Math.max(84, textH + 46) };
    case 'hexagon':
      return { w: Math.max(140, textW + 68), h: base.h };
    case 'cylinder':
      return { w: base.w, h: Math.max(74, textH + 44) };
    default:
      return base;
  }
}

/** Ukur satu node: hasilkan dimensi & pecahan baris label. */
function measureNode(spec: PositionedNode): MeasuredNode {
  const { textW, textH, lines } = measureText(spec.label);
  const { w, h } = sizeForShape(spec.shape, textW, textH);
  return { shape: spec.shape, label: spec.label, link: spec.link, branch: spec.branch, w, h, lines };
}

/**
 * Kumpulkan satu "blok" mulai dari indeks `start`:
 * - node biasa tanpa link   -> blok tunggal (satu node)
 * - rantai node berlink     -> blok linear
 * - node `[cabang]`         -> blok cabang: node sumber + dua node tujuan
 *   yang ditata berdampingan (bersebelihan melintang arah layout).
 */
function readBlock(
  nodes: readonly NodeSpec[],
  start: number,
): { kind: 'linear' | 'branch'; indices: readonly number[]; branch?: { source: number; yes: number; no: number } } {
  const first = nodes[start];
  if (!first) return { kind: 'linear', indices: [] };
  if (first.branch) {
    const yes = start + 1;
    const no = start + 2;
    if (yes < nodes.length && no < nodes.length) {
      const indices = [start, yes, no];
      // Sisi "tidak" boleh melanjutkan rantai `->node` biasa setelah pasangan.
      let i = no;
      while (nodes[i]?.link && i + 1 < nodes.length && !nodes[i + 1]?.branch) {
        i += 1;
        indices.push(i);
      }
      return { kind: 'branch', indices, branch: { source: start, yes, no } };
    }
    // Cabang menggantung di akhir sumber → diperlakukan sebagai node biasa.
    return { kind: 'linear', indices: [start] };
  }
  const indices = [start];
  let i = start;
  // Rantai berhenti sebelum node `[cabang]` — cabang selalu blok tersendiri.
  while (nodes[i]?.link && i + 1 < nodes.length && !nodes[i + 1]?.branch) {
    i += 1;
    indices.push(i);
  }
  return { kind: 'linear', indices };
}

/** Ukuran total sebuah blok linear sepanjang arah utama. */
function linearExtent(members: readonly MeasuredNode[], direction: Direction): number {
  if (members.length === 0) return 0;
  const main = members.reduce((s, n) => s + (direction === 'horizontal' ? n.w : n.h), 0);
  return main + LAYOUT.gap * (members.length - 1);
}

/** Lebar/tinggi silang (cross) maksimum sebuah blok linear. */
function linearCross(members: readonly MeasuredNode[], direction: Direction): number {
  return Math.max(...members.map((n) => (direction === 'horizontal' ? n.h : n.w)));
}

/** Ukuran total blok cabang: sumber + sepasang node tujuan berdampingan. */
function branchExtent(
  _branch: { source: number; yes: number; no: number },
  members: readonly MeasuredNode[],
  direction: Direction,
): { main: number; cross: number } {
  const src = members[0];
  const yes = members[1];
  const no = members[2];
  if (!src || !yes || !no) return { main: 0, cross: 0 };
  const pairMain = direction === 'horizontal' ? Math.max(yes.w, no.w) : yes.h + LAYOUT.gap + no.h;
  const pairCross = direction === 'horizontal' ? yes.w + LAYOUT.gap + no.w : Math.max(yes.h, no.h);
  let main = (direction === 'horizontal' ? src.w : src.h) + LAYOUT.gap + pairMain;
  let cross = Math.max(direction === 'horizontal' ? src.h : src.w, pairCross);
  // Rantai lanjutan setelah sisi "tidak" ikut dihitung dalam ukuran blok.
  for (let i = 3; i < members.length; i++) {
    const m = members[i];
    if (!m) continue;
    main += (direction === 'horizontal' ? m.w : m.h) + LAYOUT.gap;
    cross = Math.max(cross, direction === 'horizontal' ? m.h : m.w);
  }
  return { main, cross };
}

/**
 * Tata seluruh node sesuai arah:
 * - `vertical`  : ditumpuk atas→bawah, rata tengah pada kolom selebar blok terluas.
 * - `horizontal`: dibariskan kiri→kanan, rata tengah pada baris setinggi blok terlentang.
 * Percabangan `[cabang]` ditempatkan sebagai satu unit: node sumber diikuti
 * dua node tujuan yang saling bersebelahan melintang arah layout.
 * @returns Geometri lengkap (posisi, ukuran, arah, dimensi total).
 */
export function layout(
  nodes: readonly NodeSpec[],
  edges: readonly EdgeSpec[],
  direction: Direction = 'vertical',
): DiagramGeometry {
  if (nodes.length === 0) {
    return { nodes: [], edges: [], width: 1, height: 1, direction };
  }

  const measured = nodes.map((n) =>
    measureNode({ ...n, x: 0, y: 0, w: 0, h: 0, lines: [] }),
  );

  // Baca daftar blok dari deretan node.
  interface Block {
    readonly kind: 'linear' | 'branch';
    readonly indices: readonly number[];
    readonly branch?: { source: number; yes: number; no: number };
    readonly main: number;
    readonly cross: number;
  }
  const blocks: Block[] = [];
  let idx = 0;
  while (idx < nodes.length) {
    const blk = readBlock(nodes, idx);
    if (blk.indices.length === 0) break;
    let main: number;
    let cross: number;
    const members = blk.indices.map((i) => measured[i] as MeasuredNode);
    if (blk.kind === 'branch' && blk.branch) {
      const ext = branchExtent(blk.branch, members, direction);
      main = ext.main;
      cross = ext.cross;
    } else {
      main = linearExtent(members, direction);
      cross = linearCross(members, direction);
    }
    blocks.push({ kind: blk.kind, indices: blk.indices, branch: blk.branch, main, cross });
    idx += blk.indices.length;
  }

  // Rantai linear diperlakukan seperti node tunggal (sama seperti perilaku
  // pra-cabang): gap antar semua unit seragam `LAYOUT.gap`. Hanya blok
  // percabangan yang boleh lebih lebar/tinggi dari tetangganya.
  const hasBranch = blocks.some((b) => b.kind === 'branch');
  const maxCross = Math.max(...blocks.map((b) => b.cross));
  const blockStep = hasBranch ? LAYOUT.gap : LAYOUT.gap;
  const totalMain =
    blocks.reduce((sum, b) => sum + b.main, 0) + blockStep * Math.max(0, blocks.length - 1);

  const placed: PositionedNode[] = new Array(nodes.length);

  // Helper penempatan (dipakai di dalam loop blok di bawah).
  const place = (nodeIndex: number, mainPos: number, crossPos: number): void => {
    const m = measured[nodeIndex] as MeasuredNode;
    const node: PositionedNode = direction === 'horizontal'
      ? { ...m, x: mainPos, y: crossPos }
      : { ...m, x: crossPos, y: mainPos };
    placed[nodeIndex] = node;
  };

  let cursor = 0;
  for (const block of blocks) {
    const crossBase = (maxCross - block.cross) / 2;

    if (block.kind === 'branch' && block.branch) {
      const { source, yes, no } = block.branch;
      const srcM = measured[source] as MeasuredNode;
      const yesM = measured[yes] as MeasuredNode;
      const noM = measured[no] as MeasuredNode;
      const srcMainSize = direction === 'horizontal' ? srcM.w : srcM.h;
      const srcCrossSize = direction === 'horizontal' ? srcM.h : srcM.w;
      // Sumber rata tengah terhadap lebar blok cabang.
      place(source, cursor, crossBase + (block.cross - srcCrossSize) / 2);
      const pairCursor = cursor + srcMainSize + LAYOUT.gap;
      if (direction === 'horizontal') {
        // Pasangan ya/tidak bertumpuk vertikal, sejajar sisi kanan sumber.
        const colW = Math.max(yesM.w, noM.w);
        const cx = pairCursor + (block.cross - colW) / 2;
        place(yes, cx, crossBase);
        place(no, cx, crossBase + yesM.h + LAYOUT.gap);
      } else {
        // Pasangan ya/tidak berdampingan horizontal, sejajar sisi bawah sumber.
        const rowH = Math.max(yesM.h, noM.h);
        const cy = crossBase + (block.cross - rowH) / 2;
        const colYes = pairCursor;
        const colNo = pairCursor + yesM.w + LAYOUT.gap;
        place(yes, colYes, cy + (rowH - yesM.h) / 2);
        place(no, colNo, cy + (rowH - noM.h) / 2);
      }
      // Rantai lanjutan setelah sisi "tidak".
      let innerTail = pairCursor
        + (direction === 'horizontal' ? Math.max(yesM.w, noM.w) : yesM.w + LAYOUT.gap + noM.w)
        + LAYOUT.gap;
      for (let k = 3; k < block.indices.length; k++) {
        const i = block.indices[k];
        const m = measured[i as number] as MeasuredNode;
        const mainSize = direction === 'horizontal' ? m.w : m.h;
        const crossSize = direction === 'horizontal' ? m.h : m.w;
        if (direction === 'horizontal') place(i as number, innerTail, crossBase + (block.cross - crossSize) / 2);
        else place(i as number, crossBase + (block.cross - crossSize) / 2, innerTail);
        innerTail += mainSize + LAYOUT.gap;
      }
    } else {
      let inner = cursor;
      for (const i of block.indices) {
        const m = measured[i] as MeasuredNode;
        const mainSize = direction === 'horizontal' ? m.w : m.h;
        const crossSize = direction === 'horizontal' ? m.h : m.w;
        // Tanpa cabang: setiap node rata tengah pada kanvas penuh (perilaku lama).
        // Dengan cabang: node rata tengah dalam bloknya, blok digeser ke tengah kanvas.
        const crossPos = hasBranch
          ? crossBase + (block.cross - crossSize) / 2
          : (maxCross - crossSize) / 2;
        if (direction === 'horizontal') place(i, inner, crossPos);
        else place(i, crossPos, inner);
        inner += mainSize + LAYOUT.gap;
      }
    }
    cursor += block.main + blockStep;
  }


  const width = direction === 'horizontal' ? totalMain : maxCross;
  const height = direction === 'horizontal' ? maxCross : totalMain;
  return { nodes: placed, edges, width, height, direction };
}
