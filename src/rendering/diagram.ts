import type { DiagramGeometry, PositionedNode, RenderedSvg, EdgeStyle, ThemeColors } from '../core/types';
import { CANVAS_PADDING, THEMES } from '../core/config';
import { shapeSvg } from './shapes';
import { textSvg } from './text';
import { arrowDefs, edgeSvg } from './edge';
import { groupSvg } from './group';
import { escapeXml } from './svg-utils';

function nodeSvg(
  n: PositionedNode,
  color: string,
  theme: ThemeColors,
  idx: number,
  getIcon?: (name: string) => string | undefined,
): string {
  const iconSvgStr = n.icon && getIcon ? getIcon(n.icon) : undefined;
  let inner = `${shapeSvg(n, color)}${textSvg(n, iconSvgStr, theme)}`;
  if (n.tooltip) inner = `<title>${escapeXml(n.tooltip)}</title>` + inner;

  const attrs = `class="node" data-node-idx="${idx}"${n.line !== undefined ? ` data-node-line="${n.line}"` : ''
    }`;

  if (n.link) {
    return `<a href="${escapeXml(n.link)}" target="_blank" rel="noopener noreferrer" style="cursor: pointer;">
              <g ${attrs}>${inner}</g>
            </a>`;
  }
  return `<g ${attrs}>${inner}</g>`;
}

// Di renderDiagram, ubah pemanggilan jadi:


export function renderDiagram(
  geometry: DiagramGeometry,
  edgeStyle: EdgeStyle = 'smooth',
  getIcon?: (name: string) => string | undefined,
  theme: ThemeColors = THEMES.dark,
): RenderedSvg {
  const parts: string[] = [arrowDefs(theme)];

  if (geometry.groups) {
    for (const g of geometry.groups) parts.push(groupSvg(g, theme));
  }

  const horizontal = geometry.direction === 'horizontal';
  const outCount = new Map<number, number>();

  for (const e of geometry.edges) {
    const a = geometry.nodes[e.from];
    const b = geometry.nodes[e.to];
    if (!a || !b) continue;
    const seen = outCount.get(e.from) ?? 0;
    outCount.set(e.from, seen + 1);

    const isYes = e.label?.toLowerCase().startsWith('y');
    const isNo = e.label?.toLowerCase().startsWith('t') || e.label?.toLowerCase().startsWith('n');
    const branch = a.branch ? (isYes ? ('yes' as const) : isNo ? ('no' as const) : (seen === 0 ? ('yes' as const) : ('no' as const))) : undefined;

    parts.push(edgeSvg(a, b, horizontal, branch, e.label, edgeStyle, e.undirected, theme));
  }

  geometry.nodes.forEach((n, i) => {
    const nodeColor = n.color || theme.palette[i % theme.palette.length] || theme.palette[0]!;
    parts.push(nodeSvg(n, nodeColor, theme, i, getIcon));   // ← sisipkan `i`
  });

  const { width, height } = geometry;
  const p = CANVAS_PADDING;
  const viewBox = `${-p} ${-p} ${width + p * 2} ${height + p * 2}`;
  return { markup: parts.join(''), viewBox };
}