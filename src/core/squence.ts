import { escapeXml, num } from '../rendering/svg-utils';
import { ARROW_DEFS } from '../rendering/edge';

const FONT_SIZE = 14;
const CHAR_WIDTH = 8.4;
const PAD_X = 20;
const GAP = 60;
const MSG_GAP = 50;
const HEADER_Y = 20;

export function renderSequence(source: string, errors: string[]): { markup: string; viewBox: string } {
  const lines = source.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
  let idx = 0;
  if (lines[0]?.toLowerCase() === '[sequence]') idx = 1;

  const participantMap = new Map<string, { label: string; w: number; x: number }>();
  const messages: { from: string; to: string; label: string; dashed: boolean; y: number }[] = [];

  for (let i = idx; i < lines.length; i++) {
    const line = lines[i]!;
    
    // 1. Definisikan Partisipan/Aktor (opsional)
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

    // 2. Pesan (A -> B: Teks)
    const mm = /^([A-Za-z0-9_]+)\s*(--?>|->)\s*([A-Za-z0-9_]+)\s*:\s*(.+)$/i.exec(line);
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
      
      messages.push({ from, to, label, dashed: arrow === '-->', y: 0 });
      continue;
    }

    errors.push(`Baris ${i + 1}: Sintaks sequence tidak dikenal → ${line}`);
  }

  if (participantMap.size === 0) {
    return { markup: '', viewBox: '0 0 100 100' };
  }

  // Hitung Posisi X Partisipan
  let currentX = 20;
  for (const [, p] of participantMap.entries()) {
    p.x = currentX;
    currentX += p.w + GAP;
  }

  // Hitung Posisi Y Pesan
  let currentY = HEADER_Y + 60;
  for (const m of messages) {
    m.y = currentY;
    currentY += MSG_GAP;
  }

  const totalWidth = currentX - GAP + 20;
  const totalHeight = currentY + 20;

  const parts: string[] = [ARROW_DEFS];

  // Gambar Garis Kehidupan (Lifeline)
  for (const [, p] of participantMap.entries()) {
    const cx = p.x + p.w / 2;
    parts.push(`<line x1="${num(cx)}" y1="${num(HEADER_Y + 40)}" x2="${num(cx)}" y2="${num(totalHeight - 20)}" stroke="#30363d" stroke-width="2" stroke-dasharray="4 4" />`);
  }

  // Gambar Kotak Partisipan
  for (const [, p] of participantMap.entries()) {
    parts.push(`<rect x="${num(p.x)}" y="${num(HEADER_Y)}" width="${num(p.w)}" height="40" rx="4" fill="#21262d" stroke="#58a6ff" stroke-width="2" />`);
    // PERBAIKAN: Gunakan variabel FONT_SIZE di sini
    parts.push(`<text x="${num(p.x + p.w / 2)}" y="${num(HEADER_Y + 25)}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${FONT_SIZE}" fill="#e6edf3">${escapeXml(p.label)}</text>`);
  }

  // Gambar Panah & Label Pesan
  for (const m of messages) {
    const fromP = participantMap.get(m.from)!;
    const toP = participantMap.get(m.to)!;
    const x1 = fromP.x + fromP.w / 2;
    const x2 = toP.x + toP.w / 2;
    const mx = (x1 + x2) / 2;
    const my = m.y;

    const dash = m.dashed ? 'stroke-dasharray="5 5"' : '';
    parts.push(`<line x1="${num(x1)}" y1="${num(my)}" x2="${num(x2)}" y2="${num(my)}" stroke="#7d8590" stroke-width="2" ${dash} marker-end="url(#arrow)" />`);
    parts.push(`<text x="${num(mx)}" y="${num(my - 8)}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#c9d1d9">${escapeXml(m.label)}</text>`);
  }

  return {
    markup: parts.join(''),
    viewBox: `0 0 ${num(totalWidth)} ${num(totalHeight)}`
  };
}