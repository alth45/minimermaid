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
  return { shape: spec.shape, label: spec.label, link: spec.link, w, h, lines };
}

/**
 * Tata seluruh node sesuai arah:
 * - `vertical`  : ditumpuk atas→bawah, rata tengah pada kolom selebar node terluas.
 * - `horizontal`: dibariskan kiri→kanan, rata tengah pada baris setinggi node tertinggi.
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

  if (direction === 'horizontal') {
    const maxH = Math.max(...measured.map((n) => n.h));
    let x = 0;
    const placed: PositionedNode[] = measured.map((n) => {
      const node: PositionedNode = { ...n, x, y: (maxH - n.h) / 2 };
      x += n.w + LAYOUT.gap;
      return node;
    });
    return { nodes: placed, edges, width: x - LAYOUT.gap, height: maxH, direction };
  }

  const maxW = Math.max(...measured.map((n) => n.w));
  let y = 0;
  const placed: PositionedNode[] = measured.map((n) => {
    const node: PositionedNode = { ...n, x: (maxW - n.w) / 2, y };
    y += n.h + LAYOUT.gap;
    return node;
  });

  return { nodes: placed, edges, width: maxW, height: y - LAYOUT.gap, direction };
}
