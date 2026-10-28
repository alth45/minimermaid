/* =========================================================
   Tipe domain — jantung model diagram.
   ========================================================= */

export type ShapeKind =
  | 'square' | 'round' | 'circle' | 'ellipse' | 'diamond'
  | 'triangle' | 'hexagon' | 'parallelogram' | 'cylinder' | 'document';

export interface NodeSpec {
  readonly shape: ShapeKind;
  readonly label: string;
  readonly icon?: string; // <-- Properti ikon baru
  readonly link: boolean;
  readonly branch: boolean;
  readonly parent?: number;
  readonly side?: 'yes' | 'no';
  readonly group?: string;
}

export interface EdgeSpec {
  readonly from: number;
  readonly to: number;
  readonly label?: string;
}

export type Direction = 'vertical' | 'horizontal';
export type EdgeStyle = 'smooth' | 'step' | 'straight';

export interface TextMeasurer {
  measure(text: string): number;
}

export interface ParseResult {
  readonly nodes: NodeSpec[];
  readonly edges: EdgeSpec[];
  readonly errors: string[];
  readonly direction: Direction;
}

export interface PositionedNode extends NodeSpec {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly lines: string[];
}

export interface GroupBox {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface DiagramGeometry {
  readonly nodes: readonly PositionedNode[];
  readonly edges: readonly EdgeSpec[];
  readonly width: number;
  readonly height: number;
  readonly direction: Direction;
  readonly groups?: readonly GroupBox[];
}

export interface RenderedSvg {
  readonly markup: string;
  readonly viewBox: string;
}

export interface CompileResult extends RenderedSvg {
  readonly errors: string[];
}