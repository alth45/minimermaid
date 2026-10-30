import { escapeXml, num } from '../rendering/svg-utils';
import { ARROW_DEFS } from '../rendering/edge';
import { THEMES } from './config';
import type { ThemeColors } from './types';
import { arrowDefs } from '../rendering/edge';   // ganti ARROW_DEFS


const FONT_SIZE = 14;
const CHAR_WIDTH = 8.4;
const PAD_X = 20;
const GAP = 60;
const MSG_GAP = 50;
const HEADER_Y = 20;

export function renderSequence(
  source: string,
  errors: string[],
  theme: ThemeColors = THEMES.dark,  

): { markup: string; viewBox: string } {
  const lines = source.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
  let idx = 0;
  if (lines[0]?.toLowerCase() === '[sequence]') idx = 1;

  const participantMap = new Map<string, { label: string; w: number; x: number }>();
  const messages: { from: string; to: string; label: string; dashed: boolean; y: number }[] = [];
  const blocks: { type: string; label: string; startIdx: number; endIdx: number; startY: number; endY: number }[] = [];
  const blockStack: number[] = [];

  // --- 1. PARSING ---
  for (let i = idx; i < lines.length; i++) {
    const line = lines[i]!;

    // Deteksi Loop
    const lm = /^loop\s+(.*)$/i.exec(line);
    if (lm) {
      blocks.push({ type: 'loop', label: lm[1]!, startIdx: messages.length, endIdx: -1, startY: 0, endY: 0 });
      blockStack.push(blocks.length - 1);
      continue;
    }

    // Deteksi End
    if (/^end$/i.test(line)) {
      const blockIdx = blockStack.pop();
      if (blockIdx !== undefined) {
        blocks[blockIdx]!.endIdx = messages.length - 1;
      } else {
        errors.push(`Baris ${i + 1}: "end" tanpa "loop" yang sesuai.`);
      }
      continue;
    }

    // Deteksi Participant
    const pm = /^(?:participant|actor)\s+([A-Za-z0-9_]+)(?:\s+as\s+(.+))?$/i.exec(line);
    if (pm) {
      const id = pm[1]!;
      const label = pm[2] || id;
      if (!participantMap.has(id)) {
        const w = Math.max(100, label.length * CHAR_WIDTH + PAD_X * 2);
        participantMap.set(id, { label, w, x: 0 });
      }
      continue;
    }

    // Deteksi Pesan (mendukung ->, ->>, -->, -->>)
    const mm = /^([A-Za-z0-9_]+)\s*(-->>|->>|-->|->)\s*([A-Za-z0-9_]+)\s*:\s*(.+)$/i.exec(line);
    if (mm) {
      const from = mm[1]!;
      const arrow = mm[2]!;
      const to = mm[3]!;
      const label = mm[4]!;

      if (!participantMap.has(from)) {
        const w = Math.max(100, from.length * CHAR_WIDTH + PAD_X * 2);
        participantMap.set(from, { label: from, w, x: 0 });
      }
      if (!participantMap.has(to)) {
        const w = Math.max(100, to.length * CHAR_WIDTH + PAD_X * 2);
        participantMap.set(to, { label: to, w, x: 0 });
      }

      messages.push({ from, to, label, dashed: arrow.startsWith('--'), y: 0 });
      continue;
    }

    errors.push(`Baris ${i + 1}: Sintaks sequence tidak dikenal → ${line}`);
  }

  if (participantMap.size === 0) {
    return { markup: '', viewBox: '0 0 100 100' };
  }

  // --- 2. TATA LETAK (X & Y) ---
  let currentX = 20;
  for (const [, p] of participantMap.entries()) {
    p.x = currentX;
    currentX += p.w + GAP;
  }

  let currentY = HEADER_Y + 60;
  for (const m of messages) {
    // Beri jarak ekstra jika ada blok (loop) yang dimulai di pesan ini
    const hasBlock = blocks.some(b => b.startIdx === messages.indexOf(m));
    if (hasBlock) currentY += 30;

    m.y = currentY;
    currentY += MSG_GAP;
  }

  let totalHeight = currentY + 20;

  // Hitung koordinat Y untuk kotak Loop
  for (const block of blocks) {
    if (block.startIdx <= block.endIdx && messages.length > 0) {
      const firstMsgY = messages[block.startIdx]!.y;
      const lastMsgY = messages[block.endIdx]!.y;
      block.startY = firstMsgY - 30;
      block.endY = lastMsgY + 20;
    } else if (block.startIdx === messages.length) {
      block.startY = currentY;
      block.endY = currentY + 30;
      totalHeight += 30;
    }
  }

  const totalWidth = currentX - GAP + 20;

  // --- 3. RENDERING ---
  const parts: string[] = [arrowDefs(theme)];

  // A. Gambar Kotak Blok (Loop) di belakang
  for (const block of blocks) {
    if (block.startIdx > block.endIdx && block.startIdx !== messages.length) continue;

    let minX = Infinity;
    let maxX = -Infinity;
    for (const p of participantMap.values()) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x + p.w);
    }

    if (minX === Infinity) continue;

    const bx = minX - 20;
    const bw = maxX - minX + 40;
    const bh = block.endY - block.startY;

    // Kotak luar
    parts.push(`<rect x="${num(bx)}" y="${num(block.startY)}" width="${num(bw)}" height="${num(bh)}" fill="none" stroke="${theme.classStroke}" stroke-width="1.5" stroke-dasharray="4 4" rx="4" />`);

    // Label Tab
    const labelW = block.label.length * 7.5 + 20;
    parts.push(`<rect x="${num(bx)}" y="${num(block.startY - 10)}" width="${num(labelW)}" height="20" fill="${theme.classFill}" stroke="#58a6ff" stroke-width="1.5" rx="4" />`);
    parts.push(`<text x="${num(bx + 10)}" y="${num(block.startY + 4)}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#c9d1d9">${escapeXml(block.label)}</text>`);
  }

  // B. Gambar Garis Kehidupan (Lifeline)
  for (const [, p] of participantMap.entries()) {
    const cx = p.x + p.w / 2;
    parts.push(`<line x1="${num(cx)}" y1="${num(HEADER_Y + 40)}" x2="${num(cx)}" y2="${num(totalHeight - 20)}" stroke="${theme.edgeStroke}" stroke-width="2" stroke-dasharray="4 4" />`);
  }

  // C. Gambar Kotak Partisipan
  for (const [, p] of participantMap.entries()) {
    parts.push(`<rect x="${num(p.x)}" y="${num(HEADER_Y)}" width="${num(p.w)}" height="40" rx="4" fill="${theme.laneHeader}" stroke="#58a6ff" stroke-width="2" />`);
    parts.push(`<text x="${num(p.x + p.w / 2)}" y="${num(HEADER_Y + 25)}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${FONT_SIZE}" fill="${theme.nodeText}">${escapeXml(p.label)}</text>`);
  }

  // D. Gambar Panah & Label Pesan
  for (const m of messages) {
    const fromP = participantMap.get(m.from)!;
    const toP = participantMap.get(m.to)!;
    const x1 = fromP.x + fromP.w / 2;
    const x2 = toP.x + toP.w / 2;
    const my = m.y;

    const dash = m.dashed ? 'stroke-dasharray="5 5"' : '';

    // Deteksi Self-Message (Panah memutar)
    if (m.from === m.to) {
      const loopW = 40;
      const loopH = 20;
      const path = `M${num(x1)},${num(my)} C${num(x1 + loopW)},${num(my)} ${num(x1 + loopW)},${num(my + loopH)} ${num(x1)},${num(my + loopH)}`;
      parts.push(`<path d="${path}" fill="none" stroke="#7d8590" stroke-width="2" ${dash} marker-end="url(#arrow)" />`);
      parts.push(`<text x="${num(x1 + 10)}" y="${num(my + 4)}" text-anchor="start" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#c9d1d9">${escapeXml(m.label)}</text>`);
    } else {
      parts.push(`<line x1="${num(x1)}" y1="${num(my)}" x2="${num(x2)}" y2="${num(my)}" stroke="${theme.edgeStroke}" stroke-width="2" ${dash} marker-end="url(#arrow)" />`);
      const mx = (x1 + x2) / 2;
      parts.push(`<text x="${num(mx)}" y="${num(my - 8)}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="${theme.edgeLabelText}">${escapeXml(m.label)}</text>`);
    }
  }

  return {
    markup: parts.join(''),
    viewBox: `0 0 ${num(totalWidth)} ${num(totalHeight + 20)}`
  };
}