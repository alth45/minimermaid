import type { PositionedNode } from '../core/types';
import { escapeXml, num } from './svg-utils';

const LINE_HEIGHT = 19;
const FONT_FAMILY = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** 
 * Helper untuk mem-parsing markdown ringan (bold, italic, code) 
 * menjadi potongan-potongan teks dengan format SVG.
 */
function parseRichText(text: string): string {
  // Regex menangkap **bold**, *italic*, dan `code`
  const regex = /(\*\*(.*?)\*\*)|(\*(.*?)\*)|(`(.*?)`)/g;
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Teks normal sebelum markdown
    if (match.index > lastIndex) {
      result += escapeXml(text.slice(lastIndex, match.index));
    }
    
    // Terapkan format berdasarkan jenis markdown yang cocok
    if (match[0].startsWith('**')) {
      result += `<tspan font-weight="bold">${escapeXml(match[2]!)}</tspan>`;
    } else if (match[0].startsWith('*')) {
      result += `<tspan font-style="italic">${escapeXml(match[4]!)}</tspan>`;
    } else if (match[0].startsWith('`')) {
      result += `<tspan font-family="ui-monospace, monospace" fill="#79c0ff">${escapeXml(match[6]!)}</tspan>`;
    }
    
    lastIndex = regex.lastIndex;
  }

  // Sisa teks setelah markdown terakhir
  if (lastIndex < text.length) {
    result += escapeXml(text.slice(lastIndex));
  }

  return result;
}

export function textSvg(n: PositionedNode, iconSvg?: string): string {
  const hasIcon = !!n.icon && !!iconSvg;
  const hasText = n.lines.length > 0 && n.lines.some(l => l.trim() !== '');

  if (!hasIcon && !hasText) return '';

  const cx = n.x + n.w / 2;
  const baseY = n.shape === 'triangle' ? n.y + n.h * 0.6 : n.y + n.h / 2;
  const startY = baseY - ((n.lines.length - 1) * LINE_HEIGHT) / 2;

  // Bersihkan simbol markdown untuk estimasi lebar
  const cleanLines = n.lines.map(l => l.replace(/(\*\*|\*|`)/g, ''));
  const maxLen = Math.max(...cleanLines.map(l => l.length), 0);
  const textW = maxLen * 8.4;
  
  const iconW = hasIcon ? 18 : 0;
  const gap = hasIcon && hasText ? 8 : 0;
  const totalW = iconW + gap + textW;
  
  const startX = cx - totalW / 2;
  let content = '';
  
  if (hasIcon) {
    content += `<g transform="translate(${num(startX)}, ${num(baseY - 9)}) scale(0.75)" fill="none" stroke="#e6edf3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</g>`;
  }
  
  if (hasText) {
    const textX = hasIcon ? startX + iconW + gap : startX;
    
    // Render setiap baris, parse markdown-nya
    const tspans = n.lines
      .map((line, i) => {
        const richContent = parseRichText(line);
        // Hanya tspan pertama dari setiap baris yang diberi x dan dy
        return `<tspan x="${num(textX)}" dy="${i === 0 ? 0 : LINE_HEIGHT}">${richContent}</tspan>`;
      })
      .join('');
      
    content += `<text x="${num(textX)}" y="${num(startY)}" text-anchor="start" dominant-baseline="middle"
                font-family="${FONT_FAMILY}" font-size="14" font-weight="500" fill="#e6edf3">${tspans}</text>`;
  }

  return content;
}