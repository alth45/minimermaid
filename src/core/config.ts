import type { ShapeKind, ThemeColors, ThemeName } from './types';

/* =========================================================
   Konstanta & konfigurasi lintas-layer.
   ========================================================= */

const DARK: ThemeColors = {
  canvasBg:      '#0d1117',
  nodeText:      '#e6edf3',
  nodeCodeText:  '#79c0ff',
  iconStroke:    '#e6edf3',
  edgeStroke:    '#7d8590',
  edgeLabelBg:   '#0d1117',
  edgeLabelText: '#c9d1d9',
  groupStroke:   '#58a6ff',
  groupFill:     '#0d1117',
  groupText:     '#8b949e',
  laneFill:      '#161b22',
  laneHeader:    '#21262d',
  laneStroke:    '#30363d',
  laneText:      '#c9d1d9',
  classFill:     '#161b22',
  classStroke:   '#58a6ff',
  classTitle:    '#e6edf3',
  classBody:     '#c9d1d9',
  noteFill:      '#fef08a',
  noteStroke:    '#d29922',
  noteText:      '#422006',
  palette: ['#58a6ff', '#a371f7', '#3fb950', '#d29922', '#f778ba', '#39c5cf', '#ff7b72', '#bc8cff'],
};

const LIGHT: ThemeColors = {
  canvasBg:      '#ffffff',
  nodeText:      '#1f2328',
  nodeCodeText:  '#0550ae',
  iconStroke:    '#1f2328',
  edgeStroke:    '#656d76',
  edgeLabelBg:   '#ffffff',
  edgeLabelText: '#1f2328',
  groupStroke:   '#0969da',
  groupFill:     '#f6f8fa',
  groupText:     '#57606a',
  laneFill:      '#f6f8fa',
  laneHeader:    '#eaeef2',
  laneStroke:    '#d0d7de',
  laneText:      '#1f2328',
  classFill:     '#f6f8fa',
  classStroke:   '#0969da',
  classTitle:    '#1f2328',
  classBody:     '#24292f',
  noteFill:      '#fff8c5',
  noteStroke:    '#bf8700',
  noteText:      '#4d2d00',
  palette: ['#0969da', '#8250df', '#1a7f37', '#9a6700', '#bf3989', '#1b7c83', '#cf222e', '#6639ba'],
};

export const THEMES: Record<ThemeName, ThemeColors> = { dark: DARK, light: LIGHT };

/** Default palette (dark) — tetap diekspor untuk backwards-compat. */
export const PALETTE: readonly string[] = DARK.palette;

export const LAYOUT = {
  charWidth: 8.4,
  lineHeight: 19,
  gap: 74,
  blockGap: 26,
  branchLabelMinW: 40,
  padX: 46,
  padY: 34,
  minW: 110,
  minH: 58,
} as const;

export const CANVAS_PADDING = 52;

export const ALL_SHAPES: readonly ShapeKind[] = [
  'square', 'round', 'circle', 'ellipse', 'diamond',
  'triangle', 'hexagon', 'parallelogram', 'cylinder', 'document',
];

export const DEFAULT_SOURCE = `# MiniMermaid — contoh diagram
->[round]->text["Mulai"]->node
->[diamond]->text["Kondisi\\nterpenuhi?"]->node
->[square]->text["Proses data"]->node
->[triangle]->text["Selesai"]

# contoh bentuk lain
->[cylinder]->text["Database"]
->[hexagon]->text["Service A"]->node
->[parallelogram]->text["Service B"]`;