import type { GroupBox } from '../core/types';
import { escapeXml } from './svg-utils';

/** Hasilkan kotak background dengan label grup di pojok kiri atas. */
export function groupSvg(g: GroupBox): string {
  const rect = `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="8" 
                      fill="#0d1117" fill-opacity="0.6" stroke="#30363d" 
                      stroke-width="1.5" stroke-dasharray="6 4"/>`;
  const text = `<text x="${g.x + 14}" y="${g.y + 20}" 
                      font-family="ui-sans-serif, system-ui, sans-serif" 
                      font-size="12" font-weight="600" fill="#8b949e" letter-spacing="0.5">${escapeXml(g.name)}</text>`;
  return `<g class="group-box">${rect}${text}</g>`;
}