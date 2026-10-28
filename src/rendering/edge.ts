import type { PositionedNode, EdgeStyle } from '../core/types';
import { LAYOUT } from '../core/config';
import { num } from './svg-utils';

export type BranchSide = 'yes' | 'no';
const LABEL_FONT_SIZE = 12;

function anchorPair(
  a: PositionedNode,
  b: PositionedNode,
  horizontal: boolean,
): { x1: number; y1: number; x2: number; y2: number; along: 'main' | 'cross' } {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  const crosswise = horizontal
    ? Math.abs(bcy - acy) > Math.abs(bcx - acx)
    : Math.abs(bcx - acx) > Math.abs(bcy - acy);
  if (!crosswise) {
    return horizontal
      ? { x1: a.x + a.w, y1: acy, x2: b.x - 2, y2: bcy, along: 'main' }
      : { x1: acx, y1: a.y + a.h, x2: bcx, y2: b.y - 2, along: 'main' };
  }
  if (horizontal) {
    const up = bcy < acy;
    return {
      x1: acx, y1: up ? a.y : a.y + a.h,
      x2: bcx, y2: up ? b.y + b.h + 2 : b.y - 2, along: 'cross',
    };
  }
  const left = bcx < acx;
  return {
    x1: left ? a.x : a.x + a.w, y1: acy,
    x2: left ? b.x + b.w + 2 : b.x - 2, y2: bcy, along: 'cross',
  };
}

export function edgeSvg(
  a: PositionedNode,
  b: PositionedNode,
  horizontal = false,
  branch?: BranchSide,
  label?: string,
  style: EdgeStyle = 'smooth',
): string {
  let d: string;
  let lx = 0;
  let ly = 0;
  const midX = (a.x + a.w / 2 + b.x + b.w / 2) / 2;
  const midY = (a.y + a.h / 2 + b.y + b.h / 2) / 2;

  if (branch) {
    if (horizontal) {
      const x1 = a.x + a.w;
      const y1 = a.y + a.h / 2;
      const x2 = b.x - 2;
      const y2 = b.y + b.h / 2;
      const bendX = x1 + Math.max(16, (x2 - x1) * 0.5);
      
      if (style === 'straight') {
        d = `M${num(x1)},${num(y1)} L${num(x2)},${num(y2)}`;
        lx = (x1 + x2) / 2; ly = (y1 + y2) / 2;
      } else if (style === 'step') {
        d = `M${num(x1)},${num(y1)} L${num(bendX)},${num(y1)} L${num(bendX)},${num(y2)} L${num(x2)},${num(y2)}`;
        lx = bendX; ly = (y1 + y2) / 2;
      } else {
        d = `M${num(x1)},${num(y1)} C${num(bendX)},${num(y1)} ${num(bendX)},${num(y2)} ${num(x2)},${num(y2)}`;
        lx = (x1 + bendX + bendX + x2) / 8; 
        ly = (y1 + 3*y1 + 3*y2 + y2) / 8;
      }
    } else {
      const x1 = a.x + a.w / 2;
      const y1 = a.y + a.h;
      const x2 = b.x + b.w / 2;
      const y2 = b.y - 2;
      const bendY = y1 + Math.max(14, (y2 - y1) * 0.4);
      
      if (style === 'straight') {
        d = `M${num(x1)},${num(y1)} L${num(x2)},${num(y2)}`;
        lx = (x1 + x2) / 2; ly = (y1 + y2) / 2;
      } else if (style === 'step') {
        d = `M${num(x1)},${num(y1)} L${num(x1)},${num(bendY)} L${num(x2)},${num(bendY)} L${num(x2)},${num(y2)}`;
        lx = (x1 + x2) / 2; ly = bendY;
      } else {
        d = `M${num(x1)},${num(y1)} C${num(x1)},${num(bendY)} ${num(x2)},${num(bendY)} ${num(x2)},${num(y2)}`;
        lx = (x1 + 3*x1 + 3*x2 + x2) / 8;
        ly = (y1 + 3*bendY + 3*bendY + y2) / 8;
      }
    }
  } else {
    const { x1, y1, x2, y2 } = anchorPair(a, b, horizontal);
    
    if (style === 'straight') {
      d = `M${num(x1)},${num(y1)} L${num(x2)},${num(y2)}`;
      lx = (x1 + x2) / 2; ly = (y1 + y2) / 2;
    } else if (style === 'step') {
      if (horizontal) {
        const mid = (x1 + x2) / 2;
        d = `M${num(x1)},${num(y1)} L${num(mid)},${num(y1)} L${num(mid)},${num(y2)} L${num(x2)},${num(y2)}`;
        lx = mid; ly = (y1 + y2) / 2;
      } else {
        const mid = (y1 + y2) / 2;
        d = `M${num(x1)},${num(y1)} L${num(x1)},${num(mid)} L${num(x2)},${num(mid)} L${num(x2)},${num(y2)}`;
        lx = (x1 + x2) / 2; ly = mid;
      }
    } else {
      if (horizontal) {
        const c = Math.max(24, (x2 - x1) * 0.45);
        d = `M${num(x1)},${num(y1)} C${num(x1 + c)},${num(y1)} ${num(x2 - c)},${num(y2)} ${num(x2)},${num(y2)}`;
      } else {
        const c = Math.max(24, (y2 - y1) * 0.45);
        d = `M${num(x1)},${num(y1)} C${num(x1)},${num(y1 + c)} ${num(x2)},${num(y2 - c)} ${num(x2)},${num(y2)}`;
      }
      lx = midX; ly = midY;
    }
  }

  const path = `<path d="${d}" fill="none" stroke="#7d8590" stroke-width="2"
                stroke-linecap="round" marker-end="url(#arrow)"/>`;
  if (!label || !branch) return path;

  const w = Math.max(LAYOUT.branchLabelMinW, label.length * LABEL_FONT_SIZE * 0.66 + 10);
  const h = LABEL_FONT_SIZE + 8;
  const bg = `<rect x="${num(lx - w / 2)}" y="${num(ly - h / 2)}" width="${num(w)}" height="${num(h)}"
                   rx="6" fill="#0d1117" opacity="0.9"/>`;
  const text = `<text x="${num(lx)}" y="${num(ly + LABEL_FONT_SIZE * 0.35)}" text-anchor="middle"
                     font-size="${LABEL_FONT_SIZE}" fill="#c9d1d9">${escapeXml(label)}</text>`;
  return `${path}${bg}${text}`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const ARROW_DEFS = `<defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#7d8590"/>
    </marker>
  </defs>`;