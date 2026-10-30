import type { TextMeasurer, EdgeStyle, ThemeColors } from './types';
import { THEMES, CANVAS_PADDING } from './config';
import { heuristicMeasurer } from './layout';
import { num, escapeXml } from '../rendering/svg-utils';

/* =========================================================
   MINDMAP ENGINE — hierarki indent → pohon radial kiri/kanan.
   Root di tengah, level-1 dibelah dua ke kiri & kanan.
   Level 2+ mewarisi arah & warna parent.
   ========================================================= */

const GAP_X = 56;           // jarak horizontal antar-level
const GAP_Y = 18;           // jarak vertikal antar-sibling
const NODE_MIN_W = 70;

interface MindNode {
  text: string;
  level: number;
  color: string;
  children: MindNode[];
  x: number;
  y: number;
  w: number;
  h: number;
}

interface NodeMetrics {
  padX: number;
  padY: number;
  minH: number;
  font: number;
  weight: number;
}

function metricsFor(level: number): NodeMetrics {
  if (level === 0) return { padX: 26, padY: 11, minH: 42, font: 15, weight: 700 };
  if (level === 1) return { padX: 20, padY: 9,  minH: 36, font: 14, weight: 600 };
  return                { padX: 16, padY: 7,  minH: 32, font: 13, weight: 500 };
}

export function renderMindmap(
  source: string,
  edgeStyle: EdgeStyle = 'smooth',
  measurer: TextMeasurer = heuristicMeasurer,
  theme: ThemeColors = THEMES.dark,
): { markup: string; viewBox: string; errors: string[] } {
  const errors: string[] = [];
  const lines = source.split(/\r?\n/);

  let idx = 0;
  if (lines[0]?.trim().toLowerCase() === '[mindmap]') idx = 1;

  // --- PARSING ---
  interface Item { text: string; indent: number; line: number }
  const items: Item[] = [];
  for (let i = idx; i < lines.length; i++) {
    const raw = lines[i]!;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
    items.push({ text: trimmed, indent: raw.length - raw.trimStart().length, line: i + 1 });
  }

  if (items.length === 0) {
    return { markup: '', viewBox: '0 0 100 100', errors: ['Mindmap kosong.'] };
  }

  // --- BUILD TREE ---
  const root: MindNode = {
    text: items[0]!.text, level: 0, color: theme.palette[0]!,
    children: [], x: 0, y: 0, w: 0, h: 0,
  };
  const stack: { node: MindNode; indent: number }[] = [{ node: root, indent: items[0]!.indent }];
  let level1Idx = 0;

  for (let i = 1; i < items.length; i++) {
    const item = items[i]!;
    if (item.indent <= items[0]!.indent) {
      errors.push(`Baris ${item.line}: hanya boleh ada satu root di mindmap.`);
      continue;
    }
    while (stack.length > 1 && stack[stack.length - 1]!.indent >= item.indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1]!.node;
    const level = parent.level + 1;

    let color: string;
    if (level === 1) {
      // Level-1: warnai per-baris dengan palette (skip [0] milik root)
      const pool = theme.palette.slice(1);
      color = pool[level1Idx % pool.length] ?? theme.palette[1]!;
      level1Idx++;
    } else {
      color = parent.color;    // Level 2+ mewarisi warna parent
    }

    const node: MindNode = { text: item.text, level, color, children: [], x: 0, y: 0, w: 0, h: 0 };
    parent.children.push(node);
    stack.push({ node, indent: item.indent });
  }

  // --- MEASURE ---
  function measure(n: MindNode): void {
    const m = metricsFor(n.level);
    const textW = measurer.measure(n.text);
    n.w = Math.max(NODE_MIN_W, textW + m.padX * 2 + 4);   // +4 buffer (font mismatch)
    n.h = m.minH;
    for (const c of n.children) measure(c);
  }
  measure(root);

  // --- LAYOUT ---
  // Split root children: separuh kanan, separuh kiri
  const half = Math.ceil(root.children.length / 2);
  const rightKids = root.children.slice(0, half);
  const leftKids  = root.children.slice(half);

  interface Bounds { minX: number; maxX: number; minY: number; maxY: number }

  function layoutSubtree(node: MindNode, startY: number, direction: 1 | -1): Bounds {
    if (node.children.length === 0) {
      node.y = startY;
      return {
        minX: node.x, maxX: node.x + node.w,
        minY: node.y, maxY: node.y + node.h,
      };
    }

    const childY: number[] = [];
    let curY = startY;
    let minX = node.x, maxX = node.x + node.w;
    let minY = Infinity, maxY = -Infinity;

    for (const child of node.children) {
      // Tentukan x anak berdasarkan arah
      if (direction > 0) {
        child.x = node.x + node.w + GAP_X;
      } else {
        child.x = node.x - GAP_X - child.w;
      }
      const b = layoutSubtree(child, curY, direction);
      childY.push(child.y);
      curY = b.maxY + GAP_Y;
      minX = Math.min(minX, b.minX);
      maxX = Math.max(maxX, b.maxX);
      minY = Math.min(minY, b.minY);
      maxY = Math.max(maxY, b.maxY);
    }

    // Parent digeser ke tengah vertikal dari span anak-anaknya
    const firstCenter = childY[0]! + node.children[0]!.h / 2;
    const lastChild = node.children[node.children.length - 1]!;
    const lastCenter = childY[childY.length - 1]! + lastChild.h / 2;
    const midCenter = (firstCenter + lastCenter) / 2;
    node.y = midCenter - node.h / 2;

    return {
      minX, maxX,
      minY: Math.min(minY, node.y),
      maxY: Math.max(maxY, node.y + node.h),
    };
  }

  // Layout kanan (root.x = 0 dulu; nanti semuanya digeser)
  let rightBounds: Bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  if (rightKids.length > 0) {
    let y = 0;
    for (const child of rightKids) {
      child.x = root.w + GAP_X;
      const b = layoutSubtree(child, y, 1);
      y = b.maxY + GAP_Y;
      rightBounds.minX = Math.min(rightBounds.minX, b.minX);
      rightBounds.maxX = Math.max(rightBounds.maxX, b.maxX);
      rightBounds.minY = Math.min(rightBounds.minY, b.minY);
      rightBounds.maxY = Math.max(rightBounds.maxY, b.maxY);
    }
  }

  // Layout kiri (mulai dari x=0, ambil y=0 lagi)
  let leftBounds: Bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  if (leftKids.length > 0) {
    let y = 0;
    for (const child of leftKids) {
      child.x = -GAP_X - child.w;
      const b = layoutSubtree(child, y, -1);
      y = b.maxY + GAP_Y;
      leftBounds.minX = Math.min(leftBounds.minX, b.minX);
      leftBounds.maxX = Math.max(leftBounds.maxX, b.maxX);
      leftBounds.minY = Math.min(leftBounds.minY, b.minY);
      leftBounds.maxY = Math.max(leftBounds.maxY, b.maxY);
    }
  }

  // --- SEJAJARKAN KIRI & KANAN SECARA VERTIKAL ---
  function shiftY(n: MindNode, dy: number): void {
    n.y += dy;
    for (const c of n.children) shiftY(c, dy);
  }

  const rightH = rightKids.length > 0 ? rightBounds.maxY - rightBounds.minY : 0;
  const leftH  = leftKids.length  > 0 ? leftBounds.maxY  - leftBounds.minY  : 0;
  const totalH = Math.max(rightH, leftH);

  if (rightKids.length > 0) {
    const offset = (totalH - rightH) / 2 - rightBounds.minY;
    for (const c of rightKids) shiftY(c, offset);
  }
  if (leftKids.length > 0) {
    const offset = (totalH - leftH) / 2 - leftBounds.minY;
    for (const c of leftKids) shiftY(c, offset);
  }

  // Root vertikal di tengah
  root.y = totalH / 2 - root.h / 2;

  // --- GESER SEMUA agar root center di x=0 ---
  function shiftXY(n: MindNode, dx: number, dy: number): void {
    n.x += dx;
    n.y += dy;
    for (const c of n.children) shiftXY(c, dx, dy);
  }
  shiftXY(root, -root.w / 2, 0);

  // --- NORMALISASI ---
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  function traverse(n: MindNode): void {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.w);
    maxY = Math.max(maxY, n.y + n.h);
    for (const c of n.children) traverse(c);
  }
  traverse(root);
  shiftXY(root, -minX, -minY);
  const width  = maxX - minX;
  const height = maxY - minY;

  // --- RENDER ---
  const parts: string[] = [];

  // A. Edge (tanpa marker panah)
  function renderEdges(n: MindNode): void {
    for (const child of n.children) {
      const goesRight = child.x > n.x;
      const x1 = goesRight ? n.x + n.w : n.x;
      const y1 = n.y + n.h / 2;
      const x2 = goesRight ? child.x : child.x + child.w;
      const y2 = child.y + child.h / 2;

      let d: string;
      if (edgeStyle === 'straight') {
        d = `M${num(x1)},${num(y1)} L${num(x2)},${num(y2)}`;
      } else if (edgeStyle === 'step') {
        const mx = (x1 + x2) / 2;
        d = `M${num(x1)},${num(y1)} L${num(mx)},${num(y1)} L${num(mx)},${num(y2)} L${num(x2)},${num(y2)}`;
      } else {
        const c1x = x1 + (x2 - x1) * 0.4;
        const c2x = x1 + (x2 - x1) * 0.6;
        d = `M${num(x1)},${num(y1)} C${num(c1x)},${num(y1)} ${num(c2x)},${num(y2)} ${num(x2)},${num(y2)}`;
      }

      parts.push(`<path d="${d}" fill="none" stroke="${child.color}" stroke-width="2" stroke-linecap="round" opacity="0.65"/>`);
      renderEdges(child);
    }
  }
  renderEdges(root);

  // B. Node
  function renderNodes(n: MindNode): void {
    const m = metricsFor(n.level);
    const isRoot = n.level === 0;
    const fillOpacity = isRoot ? '55' : '28';
    const rx = n.h / 2;

    parts.push(`<g class="node">`);
    parts.push(
      `<rect x="${num(n.x)}" y="${num(n.y)}" width="${num(n.w)}" height="${num(n.h)}" rx="${num(rx)}" ` +
      `fill="${n.color}${fillOpacity}" stroke="${n.color}" stroke-width="${isRoot ? 2.5 : 2}"/>`,
    );
    parts.push(
      `<text x="${num(n.x + n.w / 2)}" y="${num(n.y + n.h / 2 + m.font * 0.35)}" text-anchor="middle" ` +
      `font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" ` +
      `font-size="${m.font}" font-weight="${m.weight}" fill="${theme.nodeText}">${escapeXml(n.text)}</text>`,
    );
    parts.push(`</g>`);

    for (const c of n.children) renderNodes(c);
  }
  renderNodes(root);

  const p = CANVAS_PADDING;
  return {
    markup: parts.join(''),
    viewBox: `${-p} ${-p} ${width + p * 2} ${height + p * 2}`,
    errors,
  };
}