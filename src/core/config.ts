import type { ShapeKind } from './types';

/* =========================================================
   Konstanta & konfigurasi lintas-layer.
   ========================================================= */

/** Warna siklik untuk node (urutan index node % panjang palette). */
export const PALETTE: readonly string[] = [
  '#58a6ff', '#a371f7', '#3fb950', '#d29922',
  '#f778ba', '#39c5cf', '#ff7b72', '#bc8cff',
];

/** Parameter pengukuran & penataan layout. */
export const LAYOUT = {
  /** Perkiraan lebar karakter pada font 14px. */
  charWidth: 8.4,
  /** Tinggi satu baris teks. */
  lineHeight: 19,
  /** Jarak vertikal antar node. */
  gap: 74,
  /** Padding dasar ukuran node. */
  padX: 46,
  padY: 34,
  /** Ukuran minimum node per bentuk. */
  minW: 110,
  minH: 58,
} as const;

/** Padding kanvas SVG di sekeliling diagram. */
export const CANVAS_PADDING = 52;

/** Semua bentuk yang didukung, untuk dokumentasi/validasi. */
export const ALL_SHAPES: readonly ShapeKind[] = [
  'square', 'round', 'circle', 'ellipse', 'diamond',
  'triangle', 'hexagon', 'parallelogram', 'cylinder', 'document',
];

/** Kode contoh yang dimuat saat pertama kali dibuka. */
export const DEFAULT_SOURCE =
`# MiniMermaid — contoh diagram
->[round]->text["Mulai"]->node
->[diamond]->text["Kondisi\\nterpenuhi?"]->node
->[square]->text["Proses data"]->node
->[triangle]->text["Selesai"]

# contoh bentuk lain
->[cylinder]->text["Database"]
->[hexagon]->text["Service A"]->node
->[parallelogram]->text["Service B"]`;
