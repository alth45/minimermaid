import type { TextMeasurer, EdgeStyle } from './types';
import { escapeXml, num } from '../rendering/svg-utils';
import { arrowDefs, UML_ARROW_DEFS } from '../rendering/edge';
import { heuristicMeasurer } from './layout';
import { THEMES } from './config';
import type { ThemeColors } from './types';
import { umlArrowDefs } from '../rendering/edge';   // ganti UML_ARROW_DEFS
/* =========================================================
   CLASS DIAGRAM ENGINE
   ========================================================= */

interface ClassNode {
  name: string;
  attributes: string[];
  methods: string[];
  children: string[];
  note?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function renderClassDiagram(
  source: string,
  edgeStyle: EdgeStyle = 'smooth',
  measurer: TextMeasurer = heuristicMeasurer,
  theme: ThemeColors = THEMES.dark, 

): { markup: string; viewBox: string; errors: string[] } {
  const errors: string[] = [];
  const lines = source.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  
  let idx = 0;
  if (lines[0]?.toLowerCase() === '[class]') idx = 1;

  const classes = new Map<string, ClassNode>();

  // --- 1. PARSING ---
  let currentClass: ClassNode | null = null;
  let inBlock = false;

  for (let i = idx; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith('class ')) {
      const m = /^class\s+(\w+)\s*\{?$/i.exec(line);
      if (m) {
        const name = m[1]!;
        currentClass = { name, attributes: [], methods: [], children: [], x: 0, y: 0, w: 0, h: 0 };
        classes.set(name, currentClass);
        inBlock = line.endsWith('{');
        if (!inBlock) currentClass = null;
      }
      continue;
    }

    if (line === '}') {
      inBlock = false;
      currentClass = null;
      continue;
    }

    if (inBlock && currentClass) {
      if (line.includes('(')) {
        currentClass.methods.push(line);
      } else {
        currentClass.attributes.push(line);
      }
      continue;
    }

    // Relasi Inheritance: A <|-- B
    const rm = /^(\w+)\s*<\|--\s*(\w+)$/.exec(line);
    if (rm) {
      const parent = rm[1]!;
      const child = rm[2]!;
      if (!classes.has(parent)) classes.set(parent, { name: parent, attributes: [], methods: [], children: [], x: 0, y: 0, w: 0, h: 0 });
      if (!classes.has(child)) classes.set(child, { name: child, attributes: [], methods: [], children: [], x: 0, y: 0, w: 0, h: 0 });
      classes.get(parent)!.children.push(child);
      continue;
    }

    // Note: note for Name "text"
    const nm = /^note\s+for\s+(\w+)\s+["'](.+)["']$/i.exec(line);
    if (nm) {
      const target = nm[1]!;
      const text = nm[2]!.replace(/\\n/g, '\n');
      if (classes.has(target)) {
        classes.get(target)!.note = text;
      }
      continue;
    }

    errors.push(`Baris ${i + 1}: Sintaks class diagram tidak dikenal → ${line}`);
  }

  if (classes.size === 0) {
    return { markup: '', viewBox: '0 0 100 100', errors };
  }

  // --- 2. MEASUREMENT ---
  const PAD = 12;
  const LINE_H = 20;
  const TITLE_H = 32;
  const DIV_H = 8;
  const MIN_W = 160;

  for (const c of classes.values()) {
    let maxW = measurer.measure(c.name) + PAD * 2;
    for (const a of c.attributes) maxW = Math.max(maxW, measurer.measure(a) + PAD * 2);
    for (const m of c.methods) maxW = Math.max(maxW, measurer.measure(m) + PAD * 2);
    
    c.w = Math.max(MIN_W, maxW);
    
    let h = TITLE_H;
    if (c.attributes.length > 0) h += DIV_H + c.attributes.length * LINE_H;
    if (c.methods.length > 0) h += DIV_H + c.methods.length * LINE_H;
    c.h = Math.max(h, 60);
  }

  // --- 3. LAYOUT (Bottom-Up Tree) ---
  const roots = Array.from(classes.values()).filter(c => 
    !Array.from(classes.values()).some(p => p.children.includes(c.name))
  );

  const GAP_X = 40;
  const GAP_Y = 80;

  function layoutTree(node: ClassNode): { w: number; h: number } {
    if (node.children.length === 0) return { w: node.w, h: node.h };
    
    const childSizes = node.children.map(cName => layoutTree(classes.get(cName)!));
    const totalChildW = childSizes.reduce((sum, s) => sum + s.w, 0) + GAP_X * (node.children.length - 1);
    const maxChildH = Math.max(...childSizes.map(s => s.h));
    
    return { w: Math.max(node.w, totalChildW), h: node.h + GAP_Y + maxChildH };
  }

  
  function placeTree(node: ClassNode, x: number, y: number) {
    node.x = x + (node.w / 2); // Simpan di tengah
    node.y = y;
    
    if (node.children.length > 0) {
      const childSizes = node.children.map(cName => layoutTree(classes.get(cName)!));
      const totalChildW = childSizes.reduce((sum, s) => sum + s.w, 0) + GAP_X * (node.children.length - 1);
      
      let cx = node.x - totalChildW / 2;
      for (let i = 0; i < node.children.length; i++) {
        const child = classes.get(node.children[i]!)!;
        const size = childSizes[i]!;
        placeTree(child, cx + size.w / 2 - child.w / 2, y + node.h + GAP_Y);
        cx += size.w + GAP_X;
      }
    }
  }

  const rootSizes = roots.map(r => layoutTree(r));
  let rx = 0;
  for (let i = 0; i < roots.length; i++) {
    const r = roots[i]!;
    const size = rootSizes[i]!;
    placeTree(r, rx + size.w / 2 - r.w / 2, 0);
    rx += size.w + GAP_X * 2;
  }

  // Normalisasi koordinat X agar tidak minus
  let minX = Infinity;
  for (const c of classes.values()) minX = Math.min(minX, c.x - c.w / 2);
  for (const c of classes.values()) c.x -= minX;

  // --- 4. RENDERING ---
  const parts: string[] = [umlArrowDefs(theme)];

  // Gambar Relasi Panah
  for (const parent of classes.values()) {
    for (const childName of parent.children) {
      const child = classes.get(childName)!;
      const x1 = parent.x;
      const y1 = parent.y + parent.h;
      const x2 = child.x;
      const y2 = child.y;

      let d = '';
      if (edgeStyle === 'straight') {
        d = `M${num(x1)},${num(y1)} L${num(x2)},${num(y2)}`;
      } else if (edgeStyle === 'step') {
        const midY = (y1 + y2) / 2;
        d = `M${num(x1)},${num(y1)} L${num(x1)},${num(midY)} L${num(x2)},${num(midY)} L${num(x2)},${num(y2)}`;
      } else {
        const c = Math.max(20, (y2 - y1) * 0.5);
        d = `M${num(x1)},${num(y1)} C${num(x1)},${num(y1 + c)} ${num(x2)},${num(y2 - c)} ${num(x2)},${num(y2)}`;
      }

      parts.push(`<path d="${d}" fill="none" stroke="${theme.edgeStroke}" stroke-width="2" marker-end="url(#uml-arrow)" />`);
    }
  }

  // Gambar Kotak Kelas
  for (const c of classes.values()) {
    const bx = c.x - c.w / 2;
    const by = c.y;

    parts.push(`<rect x="${num(bx)}" y="${num(by)}" width="${num(c.w)}" height="${num(c.h)}" fill="${theme.classFill}" stroke="${theme.classStroke}" stroke-width="2" rx="4" />`);
    
    // Garis Pemisah
    const titleY = by + TITLE_H;
    let currentY = titleY;

    if (c.attributes.length > 0 || c.methods.length > 0) {
      parts.push(`<line x1="${num(bx)}" y1="${num(currentY)}" x2="${num(bx + c.w)}" y2="${num(currentY)}" stroke="#58a6ff" stroke-width="2" />`);
    }

    // Teks Judul
    parts.push(`<text x="${num(c.x)}" y="${num(by + 21)}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="bold" fill="${theme.classTitle}">${escapeXml(c.name)}</text>`);

    // Atribut
    if (c.attributes.length > 0) {
      currentY += DIV_H;
      c.attributes.forEach((attr, i) => {
        parts.push(`<text x="${num(bx + PAD)}" y="${num(currentY + 14 + i * LINE_H)}" font-family="ui-monospace, monospace" font-size="13" fill="${theme.classBody}">${escapeXml(attr)}</text>`);
      });
      currentY += c.attributes.length * LINE_H;
    }

    // Metode
    if (c.methods.length > 0) {
      parts.push(`<line x1="${num(bx)}" y1="${num(currentY)}" x2="${num(bx + c.w)}" y2="${num(currentY)}" stroke="#58a6ff" stroke-width="2" />`);
      currentY += DIV_H;
      c.methods.forEach((m, i) => {
        parts.push(`<text x="${num(bx + PAD)}" y="${num(currentY + 14 + i * LINE_H)}" font-family="ui-monospace, monospace" font-size="13" fill="#c9d1d9">${escapeXml(m)}</text>`);
      });
    }

    // Gambar Note (Catatan Kuning)
    if (c.note) {
      const lines = c.note.split('\n');
      const noteW = Math.max(...lines.map(l => measurer.measure(l))) + 24;
      const noteH = lines.length * 18 + 24;
      const nx = bx + c.w + 30; // Posisi di kanan kotak
      const ny = by;

      // Garis putus-putus penghubung
      parts.push(`<line x1="${num(bx + c.w)}" y1="${num(by + 10)}" x2="${num(nx)}" y2="${num(ny + 10)}" stroke="#7d8590" stroke-width="1.5" stroke-dasharray="4 4" />`);

      // Kotak Note (Kuning ala UML)
      parts.push(`<path d="M${num(nx)},${num(ny)} L${num(nx + noteW - 12)},${num(ny)} L${num(nx + noteW)},${num(ny + 12)} L${num(nx + noteW)},${num(ny + noteH)} L${num(nx)},${num(ny + noteH)} Z" fill="${theme.noteFill}" stroke="${theme.noteStroke}" stroke-width="1.5" />`);
      parts.push(`<path d="M${num(nx + noteW - 12)},${num(ny)} L${num(nx + noteW - 12)},${num(ny + 12)} L${num(nx + noteW)},${num(ny + 12)}" fill="none" stroke="#d29922" stroke-width="1.5" />`);

      // Teks Note
      lines.forEach((l, i) => {
        parts.push(`<text x="${num(nx + 12)}" y="${num(ny + 20 + i * 18)}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="${theme.noteText}">${escapeXml(l)}</text>`);
      });
    }
  }

  const padding = 40;
  return {
    markup: parts.join(''),
    viewBox: `0 0 ${num(rx + padding)} ${num(roots.length > 0 ? roots[0]!.h + 300 : 300)}`,
    errors
  };
}