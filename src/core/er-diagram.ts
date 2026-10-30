import type { TextMeasurer, EdgeStyle, ThemeColors } from './types';
import { THEMES, LAYOUT, CANVAS_PADDING } from './config';
import { heuristicMeasurer } from './layout';
import { num, escapeXml } from '../rendering/svg-utils';

/* =========================================================
   ER DIAGRAM ENGINE — entities, attributes, relations.
   Notasi: Crow's foot (single tick, fan, circle).
   ========================================================= */

const TITLE_H = 34;
const ROW_H   = 24;
const PAD     = 14;
const MIN_W   = 180;
const GAP_X   = 80;
const GAP_Y   = 100;
const CROW_LEN = 12;
const SPREAD   = 7;

type Card = 'one' | 'many' | 'optional';

interface ErAttr {
  key: 'PK' | 'FK' | 'PK/FK' | null;
  name: string;
  type: string | null;
}

interface ErEntity {
  name: string;
  attrs: ErAttr[];
  x: number; y: number; w: number; h: number;
}

interface ErRelation {
  from: string; to: string;
  fromCard: Card; toCard: Card;
  label: string | null;
}

function parseCard(tok: string): Card | undefined {
  const t = tok.trim().toLowerCase();
  if (t === '1') return 'one';
  if (t === 'n' || t === 'm' || t === '*') return 'many';
  if (t === '?' || t === '0..1') return 'optional';
  return undefined;
}

function parseAttribute(line: string): ErAttr | null {
  const tokens = line.trim().split(/\s+/);
  if (!tokens[0]) return null;
  let key: ErAttr['key'] = null;
  let idx = 0;
  const head = tokens[0]!.toUpperCase();
  if (head === 'PK') { key = 'PK'; idx = 1; }
  else if (head === 'FK') { key = 'FK'; idx = 1; }
  else if (head === 'PK/FK' || head === 'PKFK' || head === 'PK,FK') { key = 'PK/FK'; idx = 1; }
  const name = tokens[idx] ?? '';
  if (!name) return null;
  const type = tokens.slice(idx + 1).join(' ') || null;
  return { key, name, type };
}

export function renderErDiagram(
  source: string,
  edgeStyle: EdgeStyle = 'smooth',
  measurer: TextMeasurer = heuristicMeasurer,
  theme: ThemeColors = THEMES.dark,
): { markup: string; viewBox: string; errors: string[] } {
  const errors: string[] = [];
  const lines = source.split(/\r?\n/).map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('//'));

  let idx = 0;
  if (lines[0]?.toLowerCase() === '[er]') idx = 1;

  const entities = new Map<string, ErEntity>();
  const relations: ErRelation[] = [];

  // --- PARSING ---
  let current: ErEntity | null = null;
  let inBlock = false;

  for (let i = idx; i < lines.length; i++) {
    const line = lines[i]!;

    const em = /^entity\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{?$/i.exec(line);
    if (em) {
      const name = em[1]!;
      current = entities.get(name) ?? { name, attrs: [], x: 0, y: 0, w: 0, h: 0 };
      entities.set(name, current);
      inBlock = line.endsWith('{');
      if (!inBlock) current = null;
      continue;
    }

    if (line === '}') { inBlock = false; current = null; continue; }

    if (inBlock && current) {
      const attr = parseAttribute(line);
      if (attr) current.attrs.push(attr);
      else errors.push(`Baris ${i + 1}: atribut tidak valid → ${line}`);
      continue;
    }

    const rm = /^([A-Za-z_][A-Za-z0-9_]*)\s+(\S+)\s*--\s*(\S+)\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s*:\s*(.+))?$/.exec(line);
    if (rm) {
      const from = rm[1]!;
      const fromCard = parseCard(rm[2]!);
      const toCard = parseCard(rm[3]!);
      const to = rm[4]!;
      const rawLabel = rm[5]?.trim();
      const label = rawLabel ? rawLabel.replace(/^["']|["']$/g, '') : null;

      if (!fromCard || !toCard) {
        errors.push(`Baris ${i + 1}: kardinalitas tidak valid (gunakan 1, N, M, *, atau ?)`);
        continue;
      }
      if (!entities.has(from)) entities.set(from, { name: from, attrs: [], x: 0, y: 0, w: 0, h: 0 });
      if (!entities.has(to))   entities.set(to,   { name: to,   attrs: [], x: 0, y: 0, w: 0, h: 0 });
      relations.push({ from, to, fromCard, toCard, label });
      continue;
    }

    errors.push(`Baris ${i + 1}: sintaks ER tidak dikenal → ${line}`);
  }

  if (entities.size === 0) return { markup: '', viewBox: '0 0 100 100', errors };

  // --- MEASUREMENT ---
  const entityList = Array.from(entities.values());
  for (const e of entityList) {
    let w = measurer.measure(e.name) + PAD * 2;
    for (const a of e.attrs) {
      const rowW = (a.key ? 34 : 0) + measurer.measure(a.name) + (a.type ? 12 + measurer.measure(a.type) : 0);
      w = Math.max(w, rowW + PAD * 2);
    }
    e.w = Math.max(MIN_W, w);
    e.h = TITLE_H + e.attrs.length * ROW_H + PAD * 2;
  }

  // --- LAYOUT (grid) ---
  const n = entityList.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const colWidths = new Array<number>(cols).fill(0);
  const rowHeights = new Array<number>(rows).fill(0);

  entityList.forEach((e, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    colWidths[c] = Math.max(colWidths[c]!, e.w);
    rowHeights[r] = Math.max(rowHeights[r]!, e.h);
  });

  let curY = 0;
  for (let r = 0; r < rows; r++) {
    let curX = 0;
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (i >= entityList.length) break;
      const e = entityList[i]!;
      e.x = curX + (colWidths[c]! - e.w) / 2;
      e.y = curY + (rowHeights[r]! - e.h) / 2;
      curX += colWidths[c]! + GAP_X;
    }
    curY += rowHeights[r]! + GAP_Y;
  }

  // --- RENDER ---
  const parts: string[] = [];

  // A. Relations
  for (const rel of relations) {
    const a = entities.get(rel.from)!;
    const b = entities.get(rel.to)!;
    const acx = a.x + a.w / 2, acy = a.y + a.h / 2;
    const bcx = b.x + b.w / 2, bcy = b.y + b.h / 2;

    let dx = bcx - acx, dy = bcy - acy;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) continue;
    dx /= dist; dy /= dist;

    const scaleA = Math.min(
      Math.abs(dx) > 0.01 ? (a.w / 2) / Math.abs(dx) : Infinity,
      Math.abs(dy) > 0.01 ? (a.h / 2) / Math.abs(dy) : Infinity,
    );
    const scaleB = Math.min(
      Math.abs(dx) > 0.01 ? (b.w / 2) / Math.abs(dx) : Infinity,
      Math.abs(dy) > 0.01 ? (b.h / 2) / Math.abs(dy) : Infinity,
    );
    const x1 = acx + dx * scaleA, y1 = acy + dy * scaleA;
    const x2 = bcx - dx * scaleB, y2 = bcy - dy * scaleB;

    let d: string;
    if (edgeStyle === 'straight') {
      d = `M${num(x1)},${num(y1)} L${num(x2)},${num(y2)}`;
    } else if (edgeStyle === 'step') {
      const mx = (x1 + x2) / 2;
      d = `M${num(x1)},${num(y1)} L${num(mx)},${num(y1)} L${num(mx)},${num(y2)} L${num(x2)},${num(y2)}`;
    } else {
      const mx = (x1 + x2) / 2;
      d = `M${num(x1)},${num(y1)} C${num(mx)},${num(y1)} ${num(mx)},${num(y2)} ${num(x2)},${num(y2)}`;
    }
    parts.push(`<path d="${d}" fill="none" stroke="${theme.edgeStroke}" stroke-width="2"/>`);

    // Cardinality markers: at A (dir into A = -dx,-dy), at B (dir into B = dx,dy)
    parts.push(cardinalityMarker(x1, y1, -dx, -dy, rel.fromCard, theme));
    parts.push(cardinalityMarker(x2, y2,  dx,  dy, rel.toCard,   theme));

    if (rel.label) {
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const w = rel.label.length * 7.5 + 12;
      const h = 20;
      parts.push(`<rect x="${num(mx - w / 2)}" y="${num(my - h / 2)}" width="${num(w)}" height="${num(h)}" rx="4" fill="${theme.edgeLabelBg}" opacity="0.92"/>`);
      parts.push(`<text x="${num(mx)}" y="${num(my + 4)}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="${theme.edgeLabelText}">${escapeXml(rel.label)}</text>`);
    }
  }

  // B. Entities
  for (let i = 0; i < entityList.length; i++) {
    const e = entityList[i]!;
    const color = theme.palette[i % theme.palette.length] ?? theme.palette[0]!;

    // Box + title bar
    parts.push(`<rect x="${num(e.x)}" y="${num(e.y)}" width="${num(e.w)}" height="${num(e.h)}" rx="6" fill="${theme.classFill}" stroke="${color}" stroke-width="2"/>`);
    parts.push(`<path d="M${num(e.x + 6)},${num(e.y)} H${num(e.x + e.w - 6)} Q${num(e.x + e.w)},${num(e.y)} ${num(e.x + e.w)},${num(e.y + 6)} V${num(e.y + TITLE_H)} H${num(e.x)} V${num(e.y + 6)} Q${num(e.x)},${num(e.y)} ${num(e.x + 6)},${num(e.y)} Z" fill="${color}28"/>`);
    parts.push(`<line x1="${num(e.x)}" y1="${num(e.y + TITLE_H)}" x2="${num(e.x + e.w)}" y2="${num(e.y + TITLE_H)}" stroke="${color}" stroke-width="2"/>`);
    parts.push(`<text x="${num(e.x + e.w / 2)}" y="${num(e.y + TITLE_H / 2 + 5)}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="700" fill="${theme.nodeText}">${escapeXml(e.name)}</text>`);

    // Attributes
    let rowY = e.y + TITLE_H + PAD;
    for (const a of e.attrs) {
      if (a.key) {
        const badgeColor = a.key === 'PK' ? '#d29922' : a.key === 'FK' ? '#58a6ff' : '#a371f7';
        parts.push(`<text x="${num(e.x + PAD)}" y="${num(rowY + 14)}" font-family="ui-monospace, monospace" font-size="10" font-weight="700" fill="${badgeColor}">${a.key}</text>`);
      }
      const nameX = e.x + PAD + (a.key ? 34 : 0);
      parts.push(`<text x="${num(nameX)}" y="${num(rowY + 14)}" font-family="ui-monospace, monospace" font-size="13" fill="${theme.nodeText}">${escapeXml(a.name)}</text>`);
      if (a.type) {
        parts.push(`<text x="${num(e.x + e.w - PAD)}" y="${num(rowY + 14)}" text-anchor="end" font-family="ui-monospace, monospace" font-size="11" fill="${theme.groupText}">${escapeXml(a.type)}</text>`);
      }
      rowY += ROW_H;
    }
  }

  const totalW = colWidths.reduce((s, w) => s + w, 0) + GAP_X * (cols - 1);
  const totalH = rowHeights.reduce((s, h) => s + h, 0) + GAP_Y * (rows - 1);
  const p = CANVAS_PADDING;
  return {
    markup: parts.join(''),
    viewBox: `${-p} ${-p} ${totalW + p * 2} ${totalH + p * 2}`,
    errors,
  };
}

function cardinalityMarker(
  px: number, py: number, dx: number, dy: number, card: Card, theme: ThemeColors,
): string {
  const color = theme.edgeStroke;

  if (card === 'one') {
    const perpX = -dy, perpY = dx, len = 8;
    return `<line x1="${num(px - perpX * len)}" y1="${num(py - perpY * len)}" x2="${num(px + perpX * len)}" y2="${num(py + perpY * len)}" stroke="${color}" stroke-width="2"/>`;
  }

  if (card === 'optional') {
    const off = 8;
    return `<circle cx="${num(px - dx * off)}" cy="${num(py - dy * off)}" r="4" fill="none" stroke="${color}" stroke-width="1.5"/>`;
  }

  // many → crow's foot
  const ax = px - dx * CROW_LEN, ay = py - dy * CROW_LEN;
  const perpX = -dy, perpY = dx;
  const p1x = px + perpX * SPREAD, p1y = py + perpY * SPREAD;
  const p3x = px - perpX * SPREAD, p3y = py - perpY * SPREAD;
  return `<path d="M${num(ax)},${num(ay)} L${num(p1x)},${num(p1y)} M${num(ax)},${num(ay)} L${num(px)},${num(py)} M${num(ax)},${num(ay)} L${num(p3x)},${num(p3y)}" fill="none" stroke="${color}" stroke-width="2"/>`;
}