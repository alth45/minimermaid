/* =========================================================
   Tipe domain — jantung model diagram.
   Layer ini bebas DOM & bebas implementasi rendering.
   ========================================================= */

/** Bentuk node yang didukung (nilai kanonik setelah alias diselesaikan). */
export type ShapeKind =
  | 'square'
  | 'round'
  | 'circle'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'hexagon'
  | 'parallelogram'
  | 'cylinder'
  | 'document';

/** Spesifikasi node mentah hasil parser (belum punya geometri). */
export interface NodeSpec {
  readonly shape: ShapeKind;
  readonly label: string;
  /** true bila baris diakhiri penanda `->node` (sambung ke node berikutnya). */
  readonly link: boolean;
}

/** Sambungan antar node berdasarkan indeks dalam daftar node. */
export interface EdgeSpec {
  readonly from: number;
  readonly to: number;
}

/** Arah penataan diagram. */
export type Direction = 'vertical' | 'horizontal';

/** Hasil parsing: model + daftar error sintaks (bukan exception). */
export interface ParseResult {
  readonly nodes: NodeSpec[];
  readonly edges: EdgeSpec[];
  readonly errors: string[];
  /** Arah layout, ditentukan direktif `[horizontal]`/`[vertikal]` di awal kode. */
  readonly direction: Direction;
}

/** Node yang sudah diukur & ditempatkan oleh layout. */
export interface PositionedNode extends NodeSpec {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** Label yang sudah dipecah per baris. */
  readonly lines: string[];
}

/** Geometri diagram lengkap siap dirender (read-only). */
export interface DiagramGeometry {
  readonly nodes: readonly PositionedNode[];
  readonly edges: readonly EdgeSpec[];
  readonly width: number;
  readonly height: number;
  /** Arah penataan node (dipakai renderer untuk menggambar edge). */
  readonly direction: Direction;
}

/** Keluaran renderer SVG: markup + viewBox-nya. */
export interface RenderedSvg {
  readonly markup: string;
  readonly viewBox: string;
}

/** Hasil pipeline lengkap: markup SVG + error parser untuk ditampilkan UI. */
export interface CompileResult extends RenderedSvg {
  readonly errors: string[];
}
