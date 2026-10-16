import type { PositionedNode } from '../core/types';
import { num } from './svg-utils';

/* =========================================================
   RENDERER EDGE — kurva bezier dari dasar node sumber
   ke puncak node tujuan, dengan ujung panah.
   ========================================================= */

/** Hasilkan elemen <path> sambungan antara dua node. */
export function edgeSvg(a: PositionedNode, b: PositionedNode): string {
  const x1 = a.x + a.w / 2;
  const y1 = a.y + a.h;
  const x2 = b.x + b.w / 2;
  const y2 = b.y - 2;
  const c = Math.max(24, (y2 - y1) * 0.45);
  const d = `M${num(x1)},${num(y1)} C${num(x1)},${num(y1 + c)} ${num(x2)},${num(y2 - c)} ${num(x2)},${num(y2)}`;
  return `<path d="${d}" fill="none" stroke="#7d8590" stroke-width="2"
                stroke-linecap="round" marker-end="url(#arrow)"/>`;
}

/** Definisi <defs> berisi marker panah (dipanggil sekali per kanvas). */
export const ARROW_DEFS = `<defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#7d8590"/>
    </marker>
  </defs>`;
