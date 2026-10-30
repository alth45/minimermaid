import type { TextMeasurer, EdgeStyle, ShapeKind, PositionedNode } from './types';
import { heuristicMeasurer } from './layout';
import { LAYOUT, PALETTE, CANVAS_PADDING } from './config';
import { shapeSvg } from '../rendering/shapes';
import { textSvg } from '../rendering/text';
import { ARROW_DEFS } from '../rendering/edge';
import { num, escapeXml } from '../rendering/svg-utils';
import { THEMES } from './config';
import type { ThemeColors } from './types';
import { arrowDefs } from '../rendering/edge';   

export function renderNetworkGraph(
  source: string,
  edgeStyle: EdgeStyle = 'smooth',
  measurer: TextMeasurer = heuristicMeasurer,
  theme: ThemeColors = THEMES.dark,   

): { markup: string; viewBox: string; errors: string[] } {
  const errors: string[] = [];
  const lines = source.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  
  let idx = 0;
  if (lines[0]?.toLowerCase() === '[network]') idx = 1;

  const nodeMap = new Map<string, { label: string, shape: ShapeKind, connections: number }>();
  const edges: { from: string, to: string, label?: string, undirected?: boolean }[] = [];

  // --- 1. PARSING ---
  for (let i = idx; i < lines.length; i++) {
    const line = lines[i]!;
    
    const defMatch = /^([A-Za-z0-9_]+)\s*:\s*(.+)$/.exec(line);
    if (defMatch && !line.includes('->') && !line.includes('--')) {
      const id = defMatch[1]!.trim();
      const label = defMatch[2]!.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
      if (!nodeMap.has(id)) nodeMap.set(id, { label, shape: 'round', connections: 0 });
      continue;
    }

    const edgeMatch = /^([A-Za-z0-9_]+)\s*(-->|---)\s*([A-Za-z0-9_]+)(?:\s*:\s*(.+))?$/.exec(line);
    if (edgeMatch) {
      const from = edgeMatch[1]!;
      const arrow = edgeMatch[2]!;
      const to = edgeMatch[3]!;
      const rawLabel = edgeMatch[4]?.trim();
      const label = rawLabel ? rawLabel.replace(/^["']|["']$/g, '') : undefined;

      if (!nodeMap.has(from)) nodeMap.set(from, { label: from, shape: 'round', connections: 0 });
      if (!nodeMap.has(to)) nodeMap.set(to, { label: to, shape: 'round', connections: 0 });

      nodeMap.get(from)!.connections++;
      nodeMap.get(to)!.connections++;

      edges.push({ from, to, label, undirected: arrow === '---' });
      continue;
    }

    if (/^[A-Za-z0-9_]+$/.test(line)) {
      if (!nodeMap.has(line)) nodeMap.set(line, { label: line, shape: 'round', connections: 0 });
      continue;
    }

    errors.push(`Baris ${i + 1}: Sintaks network graph tidak dikenal → ${line}`);
  }

  if (nodeMap.size === 0) return { markup: '', viewBox: '0 0 100 100', errors };

  const nodeNames = Array.from(nodeMap.keys());
  
  // --- 2. TENTUKAN PUSAT (Node dengan koneksi terbanyak) ---
  let centerNodeId = nodeNames[0]!;
  let maxConn = -1;
  for (const [id, n] of nodeMap.entries()) {
    if (n.connections > maxConn) {
      maxConn = n.connections;
      centerNodeId = id;
    }
  }

  // --- 3. BFS UNTUK MENENTUKAN LEVEL ---
  const levels = new Map<string, number>();
  levels.set(centerNodeId, 0);
  const queue: string[] = [centerNodeId];
  
  const adj = new Map<string, string[]>();
  for (const n of nodeNames) adj.set(n, []);
  for (const e of edges) {
    adj.get(e.from)!.push(e.to);
    adj.get(e.to)!.push(e.from);
  }

  while (queue.length > 0) {
    const u = queue.shift()!;
    const uLevel = levels.get(u)!;
    for (const v of adj.get(u) || []) {
      if (!levels.has(v)) {
        levels.set(v, uLevel + 1);
        queue.push(v);
      }
    }
  }

  for (const n of nodeNames) {
    if (!levels.has(n)) levels.set(n, 1);
  }

  const maxLevel = Math.max(...Array.from(levels.values()));
  const nodesByLevel: string[][] = Array.from({ length: maxLevel + 1 }, () => []);
  for (const [id, lvl] of levels.entries()) {
    nodesByLevel[lvl]!.push(id);
  }

  // --- 4. UKUR NODE ---
    const measured = nodeNames.map(id => {
    const n = nodeMap.get(id)!;
    const textLines = n.label.split('\n');
    // Bersihkan simbol markdown
    const cleanLines = textLines.map(l => l.replace(/(\*\*|\*|`)/g, ''));
    const textW = Math.max(...cleanLines.map(l => measurer.measure(l)), 0);
    const textH = textLines.length * LAYOUT.lineHeight;
    const w = Math.max(LAYOUT.minW, textW + LAYOUT.padX);
    const h = Math.max(LAYOUT.minH, textH + LAYOUT.padY);
    return { id, shape: n.shape, label: n.label, w, h, lines: textLines };
  });

  // --- 5. POSISI KONSENTRIS ---
  const positioned: PositionedNode[] = [];
  const nodeIndices = new Map<string, number>();
  const RING_GAP = 220; 
  
  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const ids = nodesByLevel[lvl]!;
    if (ids.length === 0) continue;

    const radius = lvl === 0 ? 0 : lvl * RING_GAP;
    const angleStep = ids.length > 1 ? (Math.PI * 2) / ids.length : 0;
    const startAngle = -Math.PI / 2; 

    ids.forEach((id, i) => {
      const m = measured.find(n => n.id === id)!;
      const angle = startAngle + i * angleStep;
      
      const x = Math.cos(angle) * radius - m.w / 2;
      const y = Math.sin(angle) * radius - m.h / 2;

      nodeIndices.set(id, positioned.length);
      positioned.push({
        shape: m.shape,
        label: m.label,
        hasLink: false,
        branch: false,
        w: m.w,
        h: m.h,
        lines: m.lines,
        x,
        y
      });
    });
  }

  // Normalisasi koordinat
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

  // --- 6. RENDER ---
  const parts: string[] = [arrowDefs(theme)];

  // A. Gambar Edges
  for (const e of edges) {
    const a = normalized[nodeIndices.get(e.from)!]!;
    const b = normalized[nodeIndices.get(e.to)!]!;
    
    const cx1 = a.x + a.w / 2;
    const cy1 = a.y + a.h / 2;
    const cx2 = b.x + b.w / 2;
    const cy2 = b.y + b.h / 2;

    const dx = cx2 - cx1;
    const dy = cy2 - cy1;

    // Cari titik potong antara garis pusat dengan tepi kotak (bounding box)
    const scaleA = Math.min(
        Math.abs(dx) > 0.01 ? (a.w / 2) / Math.abs(dx) : Infinity,
        Math.abs(dy) > 0.01 ? (a.h / 2) / Math.abs(dy) : Infinity
    );
    const x1 = cx1 + dx * scaleA;
    const y1 = cy1 + dy * scaleA;

    const scaleB = Math.min(
        Math.abs(dx) > 0.01 ? (b.w / 2) / Math.abs(dx) : Infinity,
        Math.abs(dy) > 0.01 ? (b.h / 2) / Math.abs(dy) : Infinity
    );
    const x2 = cx2 - dx * scaleB;
    const y2 = cy2 - dy * scaleB;

    const marker = e.undirected ? '' : 'marker-end="url(#arrow)"';
    
    // PERBAIKAN: Gunakan edgeStyle untuk membentuk path `d`
    let d = '';
    if (edgeStyle === 'straight') {
      d = `M${num(x1)},${num(y1)} L${num(x2)},${num(y2)}`;
    } else if (edgeStyle === 'step') {
      const midX = (x1 + x2) / 2;
      d = `M${num(x1)},${num(y1)} L${num(midX)},${num(y1)} L${num(midX)},${num(y2)} L${num(x2)},${num(y2)}`;
    } else {
      const midX = (x1 + x2) / 2;
      d = `M${num(x1)},${num(y1)} C${num(midX)},${num(y1)} ${num(midX)},${num(y2)} ${num(x2)},${num(y2)}`;
    }
    
    parts.push(`<path d="${d}" fill="none" stroke="${theme.edgeStroke}" stroke-width="2" ${marker} />`);

    if (e.label) {
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const labelW = e.label.length * 8.4 + 10;
      const labelH = 20;
      parts.push(`<rect x="${num(mx - labelW/2)}" y="${num(my - labelH/2)}" width="${num(labelW)}" height="${num(labelH)}" rx="4" fill="${theme.edgeLabelBg}" opacity="0.9"/>`);
      parts.push(`<text x="${num(mx)}" y="${num(my + 4)}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="${theme.edgeLabelText}">${escapeXml(e.label)}</text>`);
    }
  }

  // B. Gambar Nodes
  normalized.forEach((n, i) => {
    const color = theme.palette[i % theme.palette.length] ?? theme.palette[0]!;
    parts.push(`<g class="node">${shapeSvg(n, color)}${textSvg(n, undefined, theme)}</g>`);
  });

  const p = CANVAS_PADDING;
  const viewBox = `${-p} ${-p} ${width + p * 2} ${height + p * 2}`;
  
  return { markup: parts.join(''), viewBox, errors };
}