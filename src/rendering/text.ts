import type { PositionedNode } from '../core/types';
import { escapeXml, num } from './svg-utils';

/* =========================================================
   RENDERER TEKS — label multi-baris di dalam node.
   Posisi vertikal menyesuaikan bentuk (mis. segitiga digeser
   ke bawah karena bagian atasnya runcing).
   ========================================================= */

const LINE_HEIGHT = 19;
const FONT_FAMILY =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Hasilkan elemen <text> berisi <tspan> per baris label. */
export function textSvg(n: PositionedNode): string {
  const cx = n.x + n.w / 2;
  const baseY = n.shape === 'triangle' ? n.y + n.h * 0.6 : n.y + n.h / 2;
  const startY = baseY - ((n.lines.length - 1) * LINE_HEIGHT) / 2;

  const tspans = n.lines
    .map((line, i) => `<tspan x="${num(cx)}" dy="${i === 0 ? 0 : LINE_HEIGHT}">${escapeXml(line)}</tspan>`)
    .join('');

  return `<text x="${num(cx)}" y="${num(startY)}" text-anchor="middle" dominant-baseline="middle"
                font-family="${FONT_FAMILY}"
                font-size="14" font-weight="500" fill="#e6edf3">${tspans}</text>`;
}
