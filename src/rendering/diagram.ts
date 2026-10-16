import type { DiagramGeometry, PositionedNode, RenderedSvg } from '../core/types';
import { CANVAS_PADDING, PALETTE } from '../core/config';
import { shapeSvg } from './shapes';
import { textSvg } from './text';
import { ARROW_DEFS, edgeSvg } from './edge';

/* =========================================================
   KOMPOSER DIAGRAM — gabungkan defs + edges + node jadi
   satu markup SVG lengkap beserta viewBox-nya.
   ========================================================= */

/** Bungkus satu node jadi grup <g> (bentuk + teks). */
function nodeSvg(n: PositionedNode, color: string): string {
  return `<g class="node">${shapeSvg(n, color)}${textSvg(n)}</g>`;
}

/**
 * Render geometri diagram menjadi markup SVG.
 * Urutan penting: edge dulu (di belakang), lalu node.
 */
export function renderDiagram(geometry: DiagramGeometry): RenderedSvg {
  const parts: string[] = [ARROW_DEFS];

  // Edge digambar dulu supaya berada di belakang node.
  const horizontal = geometry.direction === 'horizontal';
  for (const e of geometry.edges) {
    const a = geometry.nodes[e.from];
    const b = geometry.nodes[e.to];
    if (a && b) parts.push(edgeSvg(a, b, horizontal));
  }
  geometry.nodes.forEach((n, i) => {
    parts.push(nodeSvg(n, PALETTE[i % PALETTE.length] ?? PALETTE[0] ?? '#58a6ff'));
  });

  const { width, height } = geometry;
  const p = CANVAS_PADDING;
  const viewBox = `${-p} ${-p} ${width + p * 2} ${height + p * 2}`;
  return { markup: parts.join(''), viewBox };
}
