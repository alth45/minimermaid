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

/**
 * Ukuran total blok cabang pada GRID KOLOM yang ketat:
 * - vertical  : satu kolom lebar (sumber di baris sendiri, ya|tidak sebaris),
 *               tinggi = h(sumber) + gap + max(h(ya), h(tidak)).
 * - horizontal: dua lajur sejajar (lajur-1 = sumber, lajur-2 = ya+tidak),
 *               lebar = w(sumber) + gap + max(w(ya), w(tidak)).
 * Sumber TIDAK lagi ditumpuk di slot yang sama dengan pasangannya, sehingga
 * panah cabang selalu vertikal/rapi mengikuti grid, tidak menyamping kacau.
 */
function branchExtent(
  _branch: { source: number; yes: number; no: number },
  members: readonly MeasuredNode[],
  direction: Direction,
): { main: number; cross: number } {
  const src = members[0];
  const yes = members[1];
  const no = members[2];
  if (!src || !yes || !no) return { main: 0, cross: 0 };
  let main: number;
  let cross: number;
  if (direction === 'horizontal') {
    main = src.w + LAYOUT.gap + Math.max(yes.w, no.w);
    cross = Math.max(src.h, yes.h + LAYOUT.gap + no.h);
  } else {
    main = src.h + LAYOUT.gap + Math.max(yes.h, no.h);
    cross = Math.max(src.w, yes.w + LAYOUT.gap + no.w);
  }
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

  // Setiap "unit" sepanjang arah utama punya stride-nya sendiri:
  // - node tunggal          -> ukurannya sendiri
  // - dua node berlink      -> ukuran keduanya + gap
  // - blok `[cabang]`       -> sumber + pasangan ya/tidak (+ rantai lanjutan)
  // Gap antar unit seragam `LAYOUT.gap`, sehingga deretan node tanpa cabang
  // menghasilkan tata letak yang identik dengan perilaku sebelum cabang ada.
  interface Unit {
    readonly kind: 'linear' | 'branch';
    readonly indices: readonly number[];
    readonly branch?: { source: number; yes: number; no: number };
    readonly mainSize: number;
    readonly crossSize: number;
  }
  const units: Unit[] = [];
  let idx = 0;
  while (idx < nodes.length) {
    const blk = readBlock(nodes, idx);
    if (blk.indices.length === 0) break;
    const members = blk.indices.map((i) => measured[i] as MeasuredNode);
    if (blk.kind === 'branch' && blk.branch) {
      const ext = branchExtent(blk.branch, members, direction);
      units.push({ kind: 'branch', indices: blk.indices, branch: blk.branch, mainSize: ext.main, crossSize: ext.cross });
      idx += blk.indices.length;
      continue;
    }
    // Blok linear menjadi SATU unit utuh — persis seperti layout pra-cabang:
    // setiap node rata tengah pada kanvas penuh, jarak antar node = gap.
    const mainSize =
      members.reduce((sum, m) => sum + (direction === 'horizontal' ? m.w : m.h), 0) +
      LAYOUT.gap * Math.max(0, members.length - 1);
    const crossSize = Math.max(
      ...members.map((m) => (direction === 'horizontal' ? m.h : m.w)),
    );
    units.push({ kind: 'linear', indices: blk.indices, mainSize, crossSize });
    idx += blk.indices.length;
  }

  const maxCross = Math.max(...units.map((u) => u.crossSize));
  const totalMain =
    units.reduce((sum, u) => sum + u.mainSize, 0) + LAYOUT.gap * Math.max(0, units.length - 1);

  const placed: PositionedNode[] = new Array(nodes.length);

  // Helper penempatan — argumen selalu (x, y) dalam koordinat kanvas.
  const placeXY = (nodeIndex: number, x: number, y: number): void => {
    const m = measured[nodeIndex] as MeasuredNode;
    placed[nodeIndex] = { ...m, x, y };
  };

  let cursor = 0;
  for (const unit of units) {
    const block = unit; // nama lokal agar kode penempatan di bawah tetap ringkas
    const crossBase = (maxCross - block.crossSize) / 2;

    if (block.kind === 'branch' && block.branch) {
      // GRID KETAT untuk blok [cabang]:
      // - vertical  : baris-1 = sumber (rata tengah kolom), baris-2 = ya|tidak sebaris.
      // - horizontal: lajur-1 = sumber (rata tinggi lajur), lajur-2 = ya di atas, tidak di bawah.
      const { source, yes, no } = block.branch;
      const srcM = measured[source] as MeasuredNode;
      const yesM = measured[yes] as MeasuredNode;
      const noM = measured[no] as MeasuredNode;
      if (direction === 'horizontal') {
        // Lajur-1: sumber, rata tengah terhadap tinggi blok.
        placeXY(source, cursor, crossBase + (block.crossSize - srcM.h) / 2);
        // Lajur-2: ya di atas lalu tidak di bawah, bertumpuk vertikal;
        // keduanya rata kiri lajur dan group-nya terpusat secara vertikal.
        const colX = cursor + srcM.w + LAYOUT.gap;
        const colW = Math.max(yesM.w, noM.w);
        const pairH = yesM.h + LAYOUT.gap + noM.h;
        const pairTop = crossBase + (block.crossSize - pairH) / 2;
        placeXY(yes, colX, pairTop);
        placeXY(no, colX + (colW - noM.w) / 2, pairTop + yesM.h + LAYOUT.gap);
        // Rantai lanjutan setelah sisi "tidak" — kembali ke lajur berikutnya.
        let innerTail = colX + colW + LAYOUT.gap;
        for (let k = 3; k < block.indices.length; k++) {
          const i = block.indices[k];
          const m = measured[i as number] as MeasuredNode;
          placeXY(i as number, innerTail, crossBase + (block.crossSize - m.h) / 2);
          innerTail += m.w + LAYOUT.gap;
        }
      } else {
        // Baris-1: sumber, rata tengah terhadap lebar blok.
        placeXY(source, crossBase + (block.crossSize - srcM.w) / 2, cursor);
        // Baris-2: ya dan tidak berdampingan horizontal, sebagai satu group terpusat.
        const rowY = cursor + srcM.h + LAYOUT.gap;
        const rowH = Math.max(yesM.h, noM.h);
        const pairW = yesM.w + LAYOUT.gap + noM.w;
        const px = crossBase + (block.crossSize - pairW) / 2;
        placeXY(yes, px, rowY + (rowH - yesM.h) / 2);
        placeXY(no, px + yesM.w + LAYOUT.gap, rowY + (rowH - noM.h) / 2);
        // Rantai lanjutan setelah sisi "tidak".
        let innerTail = rowY + rowH + LAYOUT.gap;
        for (let k = 3; k < block.indices.length; k++) {
          const i = block.indices[k];
          const m = measured[i as number] as MeasuredNode;
          placeXY(i as number, crossBase + (block.crossSize - m.w) / 2, innerTail);
          innerTail += m.h + LAYOUT.gap;
        }
      }
    } else {
      let inner = cursor;
      for (const i of block.indices) {
        const m = measured[i] as MeasuredNode;
        const mainSize = direction === 'horizontal' ? m.w : m.h;
        const crossSize = direction === 'horizontal' ? m.h : m.w;
        // Semua node (dengan atau tanpa cabang) rata tengah pada kanvas penuh
        // — persis perilaku layout pra-cabang.
        const crossPos = (maxCross - crossSize) / 2;
        if (direction === 'horizontal') placeXY(i, inner, crossPos);
        else placeXY(i, crossPos, inner);
        inner += mainSize + LAYOUT.gap;
      }
    }
    cursor += block.mainSize + LAYOUT.gap;
  }


  const width = direction === 'horizontal' ? totalMain : maxCross;
  const height = direction === 'horizontal' ? maxCross : totalMain;
  return { nodes: placed, edges, width, height, direction };
}
