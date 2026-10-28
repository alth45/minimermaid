import type { DiagramGeometry, Direction, EdgeSpec, NodeSpec, PositionedNode, TextMeasurer, GroupBox } from './types';
import { LAYOUT } from './config';

type MeasuredNode = Omit<PositionedNode, 'x' | 'y'>;

export const heuristicMeasurer: TextMeasurer = {
  measure(text: string): number {
    return text.length * LAYOUT.charWidth;
  },
};

function measureText(label: string, measurer: TextMeasurer): { textW: number; textH: number; lines: string[] } {
  const lines = label.split('\n');
  // Bersihkan simbol markdown sebelum diukur
  const cleanLines = lines.map(l => l.replace(/(\*\*|\*|`)/g, ''));
  const textW = Math.max(measurer.measure(''), ...cleanLines.map((l) => measurer.measure(l)));
  return { textW, textH: lines.length * LAYOUT.lineHeight, lines };
}

function sizeForShape(shape: NodeSpec['shape'], textW: number, textH: number): { w: number; h: number } {
  const base = {
    w: Math.max(LAYOUT.minW, textW + LAYOUT.padX),
    h: Math.max(LAYOUT.minH, textH + LAYOUT.padY),
  };
  switch (shape) {
    case 'triangle':      return { w: Math.max(130, textW + 70), h: Math.max(94, textH + 56) };
    case 'diamond':       return { w: Math.max(150, textW * 1.7 + LAYOUT.padX), h: Math.max(96, textH + 58) };
    case 'circle':
    case 'ellipse':       return { w: Math.max(124, textW + 56), h: Math.max(84, textH + 46) };
    case 'hexagon':       return { w: Math.max(140, textW + 68), h: base.h };
    case 'cylinder':      return { w: base.w, h: Math.max(74, textH + 44) };
    default:              return base;
  }
}

function measureNode(spec: NodeSpec, measurer: TextMeasurer): MeasuredNode {
  const { textW, textH, lines } = measureText(spec.label, measurer);
  const iconW = spec.icon ? 18 : 0;
  const gap = spec.icon && textW > 0 ? 8 : 0;
  const totalW = textW + iconW + gap;
  const { w, h } = sizeForShape(spec.shape, totalW, textH);
  return { ...spec, w, h, lines };
}

interface Cell {
  w: number;
  h: number;
  placed: { index: number; x: number; y: number }[];
}

const EMPTY_CELL: Cell = { w: 0, h: 0, placed: [] };

export function layout(
  nodes: readonly NodeSpec[],
  edges: readonly EdgeSpec[],
  direction: Direction = 'vertical',
  measurer: TextMeasurer = heuristicMeasurer,
): DiagramGeometry {
  if (nodes.length === 0) {
    return { nodes: [], edges: [], width: 1, height: 1, direction };
  }

  const measured = nodes.map((n) => measureNode(n, measurer));

  const childrenOf = new Map<number, number[]>();
  const roots: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const p = nodes[i]!.parent;
    if (p === undefined) roots.push(i);
    else {
      if (!childrenOf.has(p)) childrenOf.set(p, []);
      childrenOf.get(p)!.push(i);
    }
  }

  const horizontal = direction === 'horizontal';

  function combineChain(parts: Cell[]): Cell {
    if (parts.length === 0) return EMPTY_CELL;
    if (parts.length === 1) return parts[0]!;
    let cursor = 0;
    let cross = 0;
    const placed: Cell['placed'] = [];

    for (const p of parts) {
      if (horizontal) {
        placed.push(...p.placed.map((n) => ({ ...n, x: n.x + cursor })));
        cursor += p.w + LAYOUT.gap;
        cross = Math.max(cross, p.h);
      } else {
        placed.push(...p.placed.map((n) => ({ ...n, y: n.y + cursor })));
        cursor += p.h + LAYOUT.gap;
        cross = Math.max(cross, p.w);
      }
    }

    const w = horizontal ? cursor - LAYOUT.gap : cross;
    const h = horizontal ? cross : cursor - LAYOUT.gap;
    const result: Cell['placed'] = [];
    let cursor2 = 0;
    
    for (const p of parts) {
      const offset = horizontal ? (cross - p.h) / 2 : (cross - p.w) / 2;
      if (horizontal) {
        result.push(...p.placed.map((n) => ({ ...n, x: n.x + cursor2, y: n.y + offset })));
        cursor2 += p.w + LAYOUT.gap;
      } else {
        result.push(...p.placed.map((n) => ({ ...n, x: n.x + offset, y: n.y + cursor2 })));
        cursor2 += p.h + LAYOUT.gap;
      }
    }
    return { w, h, placed: result };
  }

  function combineCross(parts: Cell[]): Cell {
    if (parts.length === 0) return EMPTY_CELL;
    if (parts.length === 1) return parts[0]!;
    let cursor = 0;
    let main = 0;
    const placed: Cell['placed'] = [];
    const LANE_GAP = 60;

    for (const p of parts) {
      if (horizontal) {
        placed.push(...p.placed.map((n) => ({ ...n, y: n.y + cursor })));
        cursor += p.h + LANE_GAP;
        main = Math.max(main, p.w);
      } else {
        placed.push(...p.placed.map((n) => ({ ...n, x: n.x + cursor })));
        cursor += p.w + LANE_GAP;
        main = Math.max(main, p.h);
      }
    }

    const result: Cell['placed'] = [];
    let cursor2 = 0;
    for (const p of parts) {
      const offset = horizontal ? (main - p.w) / 2 : (main - p.h) / 2;
      if (horizontal) {
        result.push(...p.placed.map((n) => ({ ...n, x: n.x + offset, y: n.y + cursor2 })));
        cursor2 += p.h + LANE_GAP;
      } else {
        result.push(...p.placed.map((n) => ({ ...n, x: n.x + cursor2, y: n.y + offset })));
        cursor2 += p.w + LANE_GAP;
      }
    }
    return { w: horizontal ? main : cursor - LANE_GAP, h: horizontal ? cursor - LANE_GAP : main, placed: result };
  }

  function nodeCell(index: number): Cell {
    const m = measured[index]!;
    return { w: m.w, h: m.h, placed: [{ index, x: 0, y: 0 }] };
  }

  function subtree(index: number): Cell {
    const n = nodes[index]!;
    const kids = childrenOf.get(index) ?? [];

    if (n.branch) {
      const yesIdx = kids.find((k) => nodes[k]!.side === 'yes');
      const noIdx = kids.find((k) => nodes[k]!.side === 'no');
      const yesCell = yesIdx !== undefined ? subtree(yesIdx) : EMPTY_CELL;
      const noCell = noIdx !== undefined ? subtree(noIdx) : EMPTY_CELL;
      return branchCell(index, yesCell, noCell);
    }

    // PERBAIKAN: Ambil SEMUA anak rantai, jangan hanya satu
    const chainKids = kids.filter((k) => nodes[k]!.side === undefined);
    const self = nodeCell(index);
    if (chainKids.length === 0) return self;
    
    return combineChain([self, ...chainKids.map(k => subtree(k))]);
  }

  function branchCell(sourceIdx: number, yes: Cell, no: Cell): Cell {
    const src = measured[sourceIdx]!;
    const placed: Cell['placed'] = [];
    const hasYes = yes.w > 0 || yes.h > 0;
    const hasNo = no.w > 0 || no.h > 0;

    if (horizontal) {
      let pairH = 0;
      if (hasYes && hasNo) pairH = yes.h + LAYOUT.gap + no.h;
      else if (hasYes) pairH = yes.h;
      else if (hasNo) pairH = no.h;
      
      const totalH = Math.max(src.h, pairH);
      const srcY = (totalH - src.h) / 2;
      const pairY = (totalH - pairH) / 2;
      
      let colW = 0;
      if (hasYes && hasNo) colW = Math.max(yes.w, no.w);
      else if (hasYes) colW = yes.w;
      else if (hasNo) colW = no.w;
      
      const nextX = src.w + LAYOUT.gap;
      
      placed.push({ index: sourceIdx, x: 0, y: srcY });
      if (hasYes) placed.push(...yes.placed.map((n) => ({ ...n, x: n.x + nextX, y: n.y + pairY })));
      if (hasNo) {
        const noY = hasYes ? pairY + yes.h + LAYOUT.gap : pairY;
        placed.push(...no.placed.map((n) => ({ ...n, x: n.x + nextX, y: n.y + noY })));
      }
      
      const totalW = src.w + (hasYes || hasNo ? LAYOUT.gap + colW : 0);
      return { w: totalW, h: totalH, placed };
    }

    let pairW = 0;
    if (hasYes && hasNo) pairW = yes.w + LAYOUT.gap + no.w;
    else if (hasYes) pairW = yes.w;
    else if (hasNo) pairW = no.w;

    const totalW = Math.max(src.w, pairW);
    const srcX = (totalW - src.w) / 2;
    const pairX = (totalW - pairW) / 2;
    
    let rowH = 0;
    if (hasYes && hasNo) rowH = Math.max(yes.h, no.h);
    else if (hasYes) rowH = yes.h;
    else if (hasNo) rowH = no.h;

    const nextY = src.h + LAYOUT.gap;
    
    placed.push({ index: sourceIdx, x: srcX, y: 0 });
    if (hasYes) {
      placed.push(...yes.placed.map((n) => ({ ...n, x: n.x + pairX, y: n.y + nextY + (rowH - yes.h) / 2 })));
    }
    if (hasNo) {
      const noX = hasYes ? pairX + yes.w + LAYOUT.gap : pairX;
      placed.push(...no.placed.map((n) => ({ ...n, x: n.x + noX, y: n.y + nextY + (rowH - no.h) / 2 })));
    }

    const totalH = src.h + (hasYes || hasNo ? LAYOUT.gap + rowH : 0);
    return { w: totalW, h: totalH, placed };
  }

  const laneGroups = new Map<string | undefined, number[]>();
  for (const r of roots) {
    const lane = nodes[r]!.lane;
    if (!laneGroups.has(lane)) laneGroups.set(lane, []);
    laneGroups.get(lane)!.push(r);
  }

  const laneOrder = Array.from(laneGroups.keys()).sort((a, b) => {
    if (a === undefined) return 1;
    if (b === undefined) return -1;
    const aIdx = nodes.findIndex(n => n.lane === a);
    const bIdx = nodes.findIndex(n => n.lane === b);
    return aIdx - bIdx;
  });

  const laneCells: Cell[] = [];
  for (const lane of laneOrder) {
    const laneRoots = laneGroups.get(lane)!;
    const cells = laneRoots.map(r => subtree(r));
    laneCells.push(combineChain(cells));
  }

  const combined = combineCross(laneCells);

  const positioned: PositionedNode[] = new Array(nodes.length);
  for (const p of combined.placed) {
    const m = measured[p.index]!;
    positioned[p.index] = { ...m, x: p.x, y: p.y };
  }

  const groupBounds = new Map<string, { minX: number, minY: number, maxX: number, maxY: number }>();
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!;
    const p = positioned[i]!;
    if (!n.group) continue;
    
    const g = groupBounds.get(n.group) || { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    g.minX = Math.min(g.minX, p.x);
    g.minY = Math.min(g.minY, p.y);
    g.maxX = Math.max(g.maxX, p.x + p.w);
    g.maxY = Math.max(g.maxY, p.y + p.h);
    groupBounds.set(n.group, g);
  }

  const groups: GroupBox[] = [];
  const PAD = 24;
  const LABEL_H = 24;
  for (const [name, g] of groupBounds.entries()) {
    groups.push({
      name,
      x: g.minX - PAD,
      y: g.minY - PAD - LABEL_H,
      w: g.maxX - g.minX + PAD * 2,
      h: g.maxY - g.minY + PAD * 2 + LABEL_H
    });
  }

  const laneBounds = new Map<string, { minX: number, minY: number, maxX: number, maxY: number }>();
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!;
    const p = positioned[i]!;
    if (!n.lane) continue;
    
    const l = laneBounds.get(n.lane) || { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    l.minX = Math.min(l.minX, p.x);
    l.minY = Math.min(l.minY, p.y);
    l.maxX = Math.max(l.maxX, p.x + p.w);
    l.maxY = Math.max(l.maxY, p.y + p.h);
    laneBounds.set(n.lane, l);
  }

  for (const [name, l] of laneBounds.entries()) {
    groups.push({
      name,
      x: l.minX - PAD,
      y: l.minY - PAD - LABEL_H,
      w: l.maxX - l.minX + PAD * 2,
      h: l.maxY - l.minY + PAD * 2 + LABEL_H,
      isLane: true
    });
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of positioned) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + p.w);
    maxY = Math.max(maxY, p.y + p.h);
  }
  for (const g of groups) {
    minX = Math.min(minX, g.x);
    minY = Math.min(minY, g.y);
    maxX = Math.max(maxX, g.x + g.w);
    maxY = Math.max(maxY, g.y + g.h);
  }
  
  if (minX === Infinity) { minX = 0; minY = 0; maxX = 1; maxY = 1; }

  const stretchedGroups = groups.map(g => {
    if (!g.isLane) return g;
    
    let newX = g.x;
    let newY = g.y;
    let newW = g.w;
    let newH = g.h;

    if (direction === 'vertical') {
      newY = minY - PAD;
      newH = (maxY - minY) + PAD * 2;
    } else {
      newX = minX - PAD;
      newW = (maxX - minX) + PAD * 2;
    }

    return { ...g, x: newX, y: newY, w: newW, h: newH };
  });

  const finalPositioned = positioned.map(p => ({ ...p, x: p.x - minX, y: p.y - minY }));
  const finalGroups = stretchedGroups.map(g => ({ ...g, x: g.x - minX, y: g.y - minY }));

  return {
    nodes: finalPositioned,
    edges,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
    direction,
    groups: finalGroups,
  };
}