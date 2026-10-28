import type { TextMeasurer, EdgeStyle, ShapeKind, PositionedNode, EdgeSpec } from './types';
import { renderDiagram } from '../rendering/diagram';
import { heuristicMeasurer } from './layout';
import { LAYOUT } from './config';

export function renderStateDiagram(
  source: string,
  edgeStyle: EdgeStyle = 'smooth',
  measurer: TextMeasurer = heuristicMeasurer
): { markup: string; viewBox: string; errors: string[] } {
  const errors: string[] = [];
  const lines = source.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  
  let idx = 0;
  if (lines[0]?.toLowerCase() === '[state]') idx = 1;

  const nodeMap = new Map<string, { label: string, shape: ShapeKind }>();
  const edges: { from: string, to: string, label?: string }[] = [];

  // --- 1. PARSING ---
  for (let i = idx; i < lines.length; i++) {
    const line = lines[i]!;
    const match = /^(.*?)\s*-->\s*(.*?)(?:\s*:\s*(.+))?$/.exec(line);
    
    if (!match) {
      const defMatch = /^(\w+)\s*:\s*(.+)$/.exec(line);
      if (defMatch) {
        const name = defMatch[1]!.trim();
        const desc = defMatch[2]!.trim().replace(/\\n/g, '\n');
        if (!nodeMap.has(name)) {
          nodeMap.set(name, { label: desc, shape: 'round' });
        } else {
          nodeMap.get(name)!.label = desc;
        }
        continue;
      }
      errors.push(`Baris ${i + 1}: Sintaks tidak dikenal → ${line}`);
      continue;
    }

    let from = match[1]!.trim();
    let to = match[2]!.trim();
    const label = match[3]?.trim();

    if (from === '[*]') from = '__start';
    if (to === '[*]') to = '__end';

    if (!nodeMap.has(from)) nodeMap.set(from, { label: from === '__start' ? '' : from, shape: from === '__start' ? 'circle' : 'round' });
    if (!nodeMap.has(to)) nodeMap.set(to, { label: to === '__end' ? '' : to, shape: to === '__end' ? 'circle' : 'round' });

    edges.push({ from, to, label });
  }

  if (nodeMap.size === 0) return { markup: '', viewBox: '0 0 100 100', errors };

  const nodeNames = Array.from(nodeMap.keys());

  // --- 2. UKUR NODE ---
  const measured = nodeNames.map(id => {
    const n = nodeMap.get(id)!;
    const textLines = n.label.split('\n');
    const cleanLines = textLines.map(l => l.replace(/(\*\*|\*|`)/g, ''));
    const textW = Math.max(...cleanLines.map(l => measurer.measure(l)), 0);
    const textH = textLines.length * LAYOUT.lineHeight;
    
    let w = 0, h = 0;
    if (n.shape === 'circle') {
      w = 24; h = 24;
    } else {
      w = Math.max(LAYOUT.minW, textW + LAYOUT.padX);
      h = Math.max(LAYOUT.minH, textH + LAYOUT.padY);
    }
    return { id, shape: n.shape, label: n.label, w, h, lines: textLines };
  });

  // --- 3. LAYER ASSIGNMENT (Longest Path) ---
  const layers = new Map<string, number>();
  for (const n of nodeNames) layers.set(n, 0);

  let changed = true;
  let iterations = 0;
  while (changed && iterations < nodeNames.length) {
    changed = false;
    iterations++;
    for (const e of edges) {
      if (e.from === e.to) continue;
      const uLayer = layers.get(e.from)!;
      const vLayer = layers.get(e.to)!;
      if (vLayer <= uLayer && uLayer + 1 <= nodeNames.length) {
        layers.set(e.to, uLayer + 1);
        changed = true;
      }
    }
  }

  if (layers.has('__start')) layers.set('__start', 0);
  let maxLayer = 0;
  for (const l of layers.values()) maxLayer = Math.max(maxLayer, l);
  if (layers.has('__end')) {
    layers.set('__end', maxLayer + 1);
    maxLayer = Math.max(maxLayer, layers.get('__end')!);
  }

  // --- 4. BARYCENTER ORDERING ---
  const layerNodes = new Map<number, typeof measured>();
  for (const n of measured) {
    const l = layers.get(n.id)!;
    if (!layerNodes.has(l)) layerNodes.set(l, []);
    layerNodes.get(l)!.push(n);
  }

  for (const ns of layerNodes.values()) ns.sort((a, b) => a.id.localeCompare(b.id));

  for (let pass = 0; pass < 4; pass++) {
    for (let l = 1; l <= maxLayer; l++) {
      const currentNodes = layerNodes.get(l) || [];
      const prevNodes = layerNodes.get(l - 1) || [];
      if (prevNodes.length === 0) continue;

      const prevPos = new Map<string, number>();
      prevNodes.forEach((n, i) => prevPos.set(n.id, i));

      currentNodes.sort((a, b) => {
        const aParents = edges.filter(e => e.to === a.id).map(e => prevPos.get(e.from)).filter(v => v !== undefined) as number[];
        const bParents = edges.filter(e => e.to === b.id).map(e => prevPos.get(e.from)).filter(v => v !== undefined) as number[];
        const aAvg = aParents.length ? aParents.reduce((sum, v) => sum + v, 0) / aParents.length : Infinity;
        const bAvg = bParents.length ? bParents.reduce((sum, v) => sum + v, 0) / bParents.length : Infinity;
        return aAvg - bAvg;
      });
    }
  }

  // --- 5. COORDINATE ASSIGNMENT ---
  const nodeIndices = new Map<string, number>();
  const positioned: PositionedNode[] = [];
  const GAP_Y = 80;
  const GAP_X = 60;

  const layerWidths = new Map<number, number>();
  for (const [l, ns] of layerNodes.entries()) {
    const w = ns.reduce((sum, n) => sum + n.w, 0) + GAP_X * Math.max(0, ns.length - 1);
    layerWidths.set(l, w);
  }
  const maxTotalWidth = Math.max(...Array.from(layerWidths.values()));

  let currentY = 0;
  for (let l = 0; l <= maxLayer; l++) {
    const ns = layerNodes.get(l) || [];
    if (ns.length === 0) continue;

    const maxH = Math.max(...ns.map(n => n.h));
    const layerW = layerWidths.get(l)!;
    let currentX = (maxTotalWidth - layerW) / 2;

    for (const n of ns) {
      nodeIndices.set(n.id, positioned.length);
      positioned.push({
        shape: n.shape,
        label: n.label,
        hasLink: false,
        branch: false,
        w: n.w,
        h: n.h,
        lines: n.lines,
        x: currentX,
        y: currentY + (maxH - n.h) / 2,
      });
      currentX += n.w + GAP_X;
    }
    currentY += maxH + GAP_Y;
  }

  // --- 6. NORMALIZE & RENDER ---
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of positioned) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + p.w);
    maxY = Math.max(maxY, p.y + p.h);
  }
  const normalized = positioned.map(p => ({ ...p, x: p.x - minX, y: p.y - minY }));
  const width = maxX - minX;
  const height = maxY - minY;

  const edgeSpecs: EdgeSpec[] = edges.map(e => ({
    from: nodeIndices.get(e.from)!,
    to: nodeIndices.get(e.to)!,
    label: e.label
  }));

  const geometry = {
    nodes: normalized,
    edges: edgeSpecs,
    width,
    height,
    direction: 'vertical' as const,
  };

  const result = renderDiagram(geometry, edgeStyle, () => undefined);
  return { markup: result.markup, viewBox: result.viewBox, errors };
}