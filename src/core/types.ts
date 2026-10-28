/* =========================================================
   Tipe domain — jantung model diagram.
   ========================================================= */

export type ShapeKind =
  | 'square' | 'round' | 'circle' | 'ellipse' | 'diamond'
  | 'triangle' | 'hexagon' | 'parallelogram' | 'cylinder' | 'document';

export interface NodeSpec {
  readonly shape: ShapeKind;
  readonly label: string;
  readonly icon?: string;
  readonly color?: string;
  readonly link?: string;       // URL tujuan
  readonly tooltip?: string;    // Pesan hover
  readonly hasLink: boolean;    // Menggantikan properti `link` boolean
  readonly branch: boolean;
  readonly parent?: number;
  readonly side?: 'yes' | 'no';
  readonly group?: string;
  readonly lane?: string;
}

export interface EdgeSpec {
  readonly from: number;
  readonly to: number;
  readonly label?: string;
  readonly undirected?: boolean; // <-- Properti baru

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
  readonly isLane?: boolean; // <-- Penanda Swimlane

}

export interface GroupBox {
  [x: string]: any;
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