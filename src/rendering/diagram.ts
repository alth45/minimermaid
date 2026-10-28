import type { DiagramGeometry, PositionedNode, RenderedSvg, EdgeStyle } from '../core/types';
import { CANVAS_PADDING, PALETTE } from '../core/config';
import { shapeSvg } from './shapes';
import { textSvg } from './text';
import { ARROW_DEFS, edgeSvg } from './edge';
import { groupSvg } from './group';

function nodeSvg(n: PositionedNode, color: string, getIcon?: (name: string) => string | undefined): string {
  const iconSvgStr = n.icon && getIcon ? getIcon(n.icon) : undefined;
  return `<g class="node">${shapeSvg(n, color)}${textSvg(n, iconSvgStr)}</g>`;
}

export function renderDiagram(
  geometry: DiagramGeometry, 
  edgeStyle: EdgeStyle = 'smooth', 
  getIcon?: (name: string) => string | undefined
): RenderedSvg {
  const parts: string[] = [ARROW_DEFS];

  if (geometry.groups) {
    for (const g of geometry.groups) {
      parts.push(groupSvg(g));
    }
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
    
    parts.push(edgeSvg(a, b, horizontal, branch, e.label, edgeStyle));
  }

  geometry.nodes.forEach((n, i) => {
    parts.push(nodeSvg(n, PALETTE[i % PALETTE.length] ?? PALETTE[0] ?? '#58a6ff', getIcon));
  });

  const { width, height } = geometry;
  const p = CANVAS_PADDING;
  const viewBox = `${-p} ${-p} ${width + p * 2} ${height + p * 2}`;
  return { markup: parts.join(''), viewBox };
}