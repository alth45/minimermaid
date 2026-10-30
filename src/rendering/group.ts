import type { GroupBox, ThemeColors } from '../core/types';
import { THEMES } from '../core/config';
import { escapeXml } from './svg-utils';

export function groupSvg(g: GroupBox, theme: ThemeColors = THEMES.dark): string {
  if (g.isLane) {
    const rect = `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="0"
                        fill="${theme.laneFill}" fill-opacity="0.8" stroke="${theme.laneStroke}" stroke-width="1.5"/>`;
    const header = `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="24" fill="${theme.laneHeader}" rx="0" />`;
    const text = `<text x="${g.x + g.w / 2}" y="${g.y + 16}" text-anchor="middle"
                        font-family="ui-sans-serif, system-ui, sans-serif"
                        font-size="12" font-weight="600" fill="${theme.laneText}" letter-spacing="0.5">${escapeXml(g.name)}</text>`;
    return `<g class="lane-box">${rect}${header}${text}</g>`;
  }

  const rect = `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="8"
                      fill="${theme.groupFill}" fill-opacity="0.8" stroke="${theme.groupStroke}"
                      stroke-width="1.5" stroke-dasharray="6 4"/>`;
  const text = `<text x="${g.x + 14}" y="${g.y + 20}"
                      font-family="ui-sans-serif, system-ui, sans-serif"
                      font-size="12" font-weight="600" fill="${theme.groupText}" letter-spacing="0.5">${escapeXml(g.name)}</text>`;
  return `<g class="group-box">${rect}${text}</g>`;
}