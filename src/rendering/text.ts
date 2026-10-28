import type { PositionedNode } from '../core/types';
import { escapeXml, num } from './svg-utils';

const LINE_HEIGHT = 19;
const FONT_FAMILY = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export function textSvg(n: PositionedNode, iconSvg?: string): string {
  const hasIcon = !!n.icon && !!iconSvg;
  // Cek apakah ada teks yang valid
  const hasText = n.lines.length > 0 && n.lines.some(l => l.trim() !== '');

  if (!hasIcon && !hasText) return '';

  // Posisi Tengah
  const cx = n.x + n.w / 2;
  // Segitiga posisinya agak ke bawah
  const baseY = n.shape === 'triangle' ? n.y + n.h * 0.6 : n.y + n.h / 2;
  const startY = baseY - ((n.lines.length - 1) * LINE_HEIGHT) / 2;

  // Estimasi lebar teks (heuristik 8.4px per karakter) untuk menghitung titik mulai (centering)
  const maxLen = Math.max(...n.lines.map(l => l.length), 0);
  const textW = maxLen * 8.4;
  
  // Dimensi ikon (18x18)
  const iconW = hasIcon ? 18 : 0;
  // Jarak antara ikon dan teks
  const gap = (hasIcon && hasText) ? 8 : 0;
  
  const totalW = iconW + gap + textW;
  
  // Titik awal gambar (X)
  const startX = cx - totalW / 2;

  let content = '';
  
  // 1. Gambar Ikon (jika ada)
  if (hasIcon) {
    content += `<g transform="translate(${num(startX)}, ${num(baseY - 9)}) scale(0.75)" 
                   fill="none" stroke="#e6edf3" stroke-width="2" 
                   stroke-linecap="round" stroke-linejoin="round">
                   ${iconSvg}
                </g>`;
  }
  
  // 2. Gambar Teks (jika ada)
  if (hasText) {
    const textX = hasIcon ? startX + iconW + gap : startX;
    const tspans = n.lines
      .map((line, i) => `<tspan x="${num(textX)}" dy="${i === 0 ? 0 : LINE_HEIGHT}">${escapeXml(line)}</tspan>`)
      .join('');
      
    content += `<text x="${num(textX)}" y="${num(startY)}" text-anchor="start" dominant-baseline="middle"
                font-family="${FONT_FAMILY}" font-size="14" font-weight="500" fill="#e6edf3">${tspans}</text>`;
  }

  return content;
}