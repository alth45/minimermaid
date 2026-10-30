import type { PositionedNode, ThemeColors } from '../core/types';
import { THEMES } from '../core/config';
import { escapeXml, num } from './svg-utils';

const LINE_HEIGHT = 19;
const FONT_FAMILY = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function parseRichText(text: string, theme: ThemeColors): string {
  const regex = /(\*\*(.*?)\*\*)|(\*(.*?)\*)|(`(.*?)`)/g;
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result += escapeXml(text.slice(lastIndex, match.index));
    }
    if (match[0].startsWith('**')) {
      result += `<tspan font-weight="bold">${escapeXml(match[2]!)}</tspan>`;
    } else if (match[0].startsWith('*')) {
      result += `<tspan font-style="italic">${escapeXml(match[4]!)}</tspan>`;
    } else if (match[0].startsWith('`')) {
      result += `<tspan font-family="ui-monospace, monospace" fill="${theme.nodeCodeText}">${escapeXml(match[6]!)}</tspan>`;
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) result += escapeXml(text.slice(lastIndex));
  return result;
}

export function textSvg(n: PositionedNode, iconSvg?: string, theme: ThemeColors = THEMES.dark): string {
  const hasIcon = !!n.icon && !!iconSvg;
  const hasText = n.lines.length > 0 && n.lines.some(l => l.trim() !== '');
  if (!hasIcon && !hasText) return '';

  const cx = n.x + n.w / 2;
  const baseY = n.shape === 'triangle' ? n.y + n.h * 0.6 : n.y + n.h / 2;
  const startY = baseY - ((n.lines.length - 1) * LINE_HEIGHT) / 2;

  const cleanLines = n.lines.map(l => l.replace(/(\*\*|\*|`)/g, ''));
  const maxLen = Math.max(...cleanLines.map(l => l.length), 0);
  const textW = maxLen * 8.4;

  const iconW = hasIcon ? 18 : 0;
  const gap = hasIcon && hasText ? 8 : 0;
  const totalW = iconW + gap + textW;
  const startX = cx - totalW / 2;
  let content = '';

  if (hasIcon) {
    content += `<g transform="translate(${num(startX)}, ${num(baseY - 9)}) scale(0.75)" fill="none" stroke="${theme.iconStroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</g>`;
  }

  if (hasText) {
    const textX = hasIcon ? startX + iconW + gap : startX;
    const tspans = n.lines
      .map((line, i) => {
        const richContent = parseRichText(line, theme);
        return `<tspan x="${num(textX)}" dy="${i === 0 ? 0 : LINE_HEIGHT}">${richContent}</tspan>`;
      })
      .join('');
    content += `<text x="${num(textX)}" y="${num(startY)}" text-anchor="start" dominant-baseline="middle"
                font-family="${FONT_FAMILY}" font-size="14" font-weight="500" fill="${theme.nodeText}">${tspans}</text>`;
  }

  return content;
}