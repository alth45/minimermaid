import type { GroupBox } from '../core/types';
import { escapeXml } from './svg-utils';

export function groupSvg(g: GroupBox): string {
  // Render khusus untuk SWIMLANE
  if (g.isLane) {
    const rect = `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="0" 
                        fill="#161b22" fill-opacity="0.8" stroke="#30363d" stroke-width="1.5"/>`;
    const header = `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="24" fill="#21262d" rx="0" />`;
    const text = `<text x="${g.x + g.w / 2}" y="${g.y + 16}" text-anchor="middle"
                        font-family="ui-sans-serif, system-ui, sans-serif" 
                        font-size="12" font-weight="600" fill="#c9d1d9" letter-spacing="0.5">${escapeXml(g.name)}</text>`;
    return `<g class="lane-box">${rect}${header}${text}</g>`;
  }

  // Render untuk GROUP biasa
  const rect = `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="8" 
                      fill="#0d1117" fill-opacity="0.8" stroke="#58a6ff" 
                      stroke-width="1.5" stroke-dasharray="6 4"/>`;
  const text = `<text x="${g.x + 14}" y="${g.y + 20}" 
                      font-family="ui-sans-serif, system-ui, sans-serif" 
                      font-size="12" font-weight="600" fill="#8b949e" letter-spacing="0.5">${escapeXml(g.name)}</text>`;
  return `<g class="group-box">${rect}${text}</g>`;
}