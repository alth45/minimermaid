import type { TextMeasurer, EdgeStyle, ThemeColors } from './types';
import { THEMES, CANVAS_PADDING } from './config';
import { heuristicMeasurer } from './layout';
import { num, escapeXml } from '../rendering/svg-utils';

/* =========================================================
   TIMELINE ENGINE — kejadian berurutan horizontal.
   Desain:
     - Garis horizontal dengan milestone circle
     - Kartu event bergantian di atas/bawah
     - Kartu berisi: tanggal (mono, berwarna) + label (bold) + sublabel (opsional)
   ========================================================= */

const CIRCLE_R   = 9;
const STEM_LEN   = 24;
const CARD_PAD_X = 14;
const CARD_PAD_Y = 10;
const CARD_RX    = 10;
const GAP_X      = 36;
const DATE_LINE_H = 15;
const LABEL_LINE_H = 19;
const SUB_LINE_H   = 16;
const FONT_DATE  = 11;
const FONT_LABEL = 13;
const FONT_SUB   = 11;
const TITLE_H    = 30;
const TITLE_GAP  = 20;
const MIN_CARD_W = 90;

interface Ev {
  date: string;
  label: string;
  sublabel?: string;
  cardW: number;
  cardH: number;
}

export function renderTimeline(
  source: string,
  _edgeStyle: EdgeStyle = 'smooth',
  measurer: TextMeasurer = heuristicMeasurer,
  theme: ThemeColors = THEMES.dark,
): { markup: string; viewBox: string; errors: string[] } {
  const errors: string[] = [];
  const lines = source.split(/\r?\n/);

  let idx = 0;
  if (lines[0]?.trim().toLowerCase() === '[timeline]') idx = 1;

  let title: string | null = null;
  const events: Ev[] = [];

  for (let i = idx; i < lines.length; i++) {
    const raw = lines[i]!;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    const tm = /^(?:title|judul)\s*:\s*(.+)$/i.exec(trimmed);
    if (tm) {
      title = tm[1]!.trim().replace(/^["']|["']$/g, '');
      continue;
    }

    const parts = trimmed.split(/\s*:\s*/);
    if (parts.length < 2) {
      errors.push(`Baris ${i + 1}: format event harus "tanggal : label [: sublabel]".`);
      continue;
    }
    const date = parts[0]!.trim();
    const label = parts[1]!.trim();
    const sublabel = parts[2]?.trim() || undefined;

    if (!date || !label) {
      errors.push(`Baris ${i + 1}: tanggal dan label wajib diisi.`);
      continue;
    }
    events.push({ date, label, sublabel, cardW: 0, cardH: 0 });
  }

  if (events.length === 0) {
    return { markup: '', viewBox: '0 0 100 100', errors: [...errors, 'Timeline kosong.'] };
  }

  // --- MEASURE ---
  let maxCardW = 0;
  let maxCardH = 0;
  for (const ev of events) {
    const w1 = measurer.measure(ev.date);
    const w2 = measurer.measure(ev.label);
    const w3 = ev.sublabel ? measurer.measure(ev.sublabel) : 0;
    ev.cardW = Math.max(Math.max(w1, w2, w3) + CARD_PAD_X * 2, MIN_CARD_W);

    let h = CARD_PAD_Y * 2 + DATE_LINE_H + LABEL_LINE_H;
    if (ev.sublabel) h += SUB_LINE_H;
    ev.cardH = h;

    maxCardW = Math.max(maxCardW, ev.cardW);
    maxCardH = Math.max(maxCardH, ev.cardH);
  }

  // --- SLOT HORIZONTAL ---
  const n = events.length;
  const slotSpacing = maxCardW + GAP_X;
  const totalW = slotSpacing * (n - 1) + maxCardW;

  // --- VERTICAL ---
  const titleSpace = title ? TITLE_H + TITLE_GAP : 0;
  const armLen = CIRCLE_R + STEM_LEN + maxCardH;
  const lineY = titleSpace + armLen + 10;
  const totalH = titleSpace + 2 * armLen + 30;

  // --- RENDER ---
  const parts: string[] = [];

  if (title) {
    parts.push(
      `<text x="${num(totalW / 2)}" y="${num(TITLE_H - 8)}" text-anchor="middle" ` +
      `font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" ` +
      `font-size="20" font-weight="700" fill="${theme.nodeText}">${escapeXml(title)}</text>`,
    );
  }

  // Track
  parts.push(
    `<line x1="0" y1="${num(lineY)}" x2="${num(totalW)}" y2="${num(lineY)}" ` +
    `stroke="${theme.edgeStroke}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`,
  );

  // Events
  for (let i = 0; i < n; i++) {
    const ev = events[i]!;
    const xCenter = i * slotSpacing + maxCardW / 2;
    const isTop = i % 2 === 0;
    const color = theme.palette[i % theme.palette.length] ?? theme.palette[0]!;
    const cardX = xCenter - ev.cardW / 2;

    let cardY: number, stemY1: number, stemY2: number;
    if (isTop) {
      cardY = lineY - CIRCLE_R - STEM_LEN - ev.cardH;
      stemY1 = cardY + ev.cardH;
      stemY2 = lineY - CIRCLE_R;
    } else {
      cardY = lineY + CIRCLE_R + STEM_LEN;
      stemY1 = lineY + CIRCLE_R;
      stemY2 = cardY;
    }

    // Stem
    parts.push(
      `<line x1="${num(xCenter)}" y1="${num(stemY1)}" x2="${num(xCenter)}" y2="${num(stemY2)}" ` +
      `stroke="${color}" stroke-width="2" opacity="0.7"/>`,
    );

    // Card
    parts.push(
      `<rect x="${num(cardX)}" y="${num(cardY)}" width="${num(ev.cardW)}" height="${num(ev.cardH)}" ` +
      `rx="${CARD_RX}" ry="${CARD_RX}" ` +
      `fill="${color}1f" stroke="${color}" stroke-width="2"/>`,
    );

    // Date
    const dateY = cardY + CARD_PAD_Y + DATE_LINE_H - 3;
    parts.push(
      `<text x="${num(xCenter)}" y="${num(dateY)}" text-anchor="middle" ` +
      `font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" ` +
      `font-size="${FONT_DATE}" font-weight="700" fill="${color}">${escapeXml(ev.date)}</text>`,
    );

    // Label
    const labelY = dateY + LABEL_LINE_H;
    parts.push(
      `<text x="${num(xCenter)}" y="${num(labelY)}" text-anchor="middle" ` +
      `font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" ` +
      `font-size="${FONT_LABEL}" font-weight="600" fill="${theme.nodeText}">${escapeXml(ev.label)}</text>`,
    );

    // Sublabel
    if (ev.sublabel) {
      const subY = labelY + SUB_LINE_H;
      parts.push(
        `<text x="${num(xCenter)}" y="${num(subY)}" text-anchor="middle" ` +
        `font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" ` +
        `font-size="${FONT_SUB}" font-weight="400" fill="${theme.edgeLabelText}" opacity="0.85">${escapeXml(ev.sublabel)}</text>`,
      );
    }

    // Circle (last → di atas garis & stem)
    parts.push(
      `<circle cx="${num(xCenter)}" cy="${num(lineY)}" r="${CIRCLE_R}" ` +
      `fill="${color}" stroke="${theme.canvasBg}" stroke-width="3"/>`,
    );
  }

  const p = CANVAS_PADDING;
  return {
    markup: parts.join(''),
    viewBox: `${-p} ${-p} ${totalW + p * 2} ${totalH + p * 2}`,
    errors,
  };
}