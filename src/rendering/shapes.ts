import type { PositionedNode, ShapeKind } from '../core/types';
import { num } from './svg-utils';

/* =========================================================
   RENDERER BENTUK — registry per bentuk node.
   Menambah bentuk baru = tambahkan 1 entri di SHAPE_RENDERERS
   (dan 1 baris di ShapeKind + alias di core/shapes.ts).
   ========================================================= */

/** Gaya dasar bersama: isi transparan berwarna + garis tepi. */
function stroke(color: string): string {
  return `fill="${color}22" stroke="${color}" stroke-width="2" stroke-linejoin="round"`;
}

type ShapeRenderer = (n: PositionedNode, color: string) => string;

const SHAPE_RENDERERS: Record<ShapeKind, ShapeRenderer> = {
  square: (n, color) =>
    `<rect x="${num(n.x)}" y="${num(n.y)}" width="${num(n.w)}" height="${num(n.h)}" rx="4" ${stroke(color)}/>`,
  round: (n, color) =>
    `<rect x="${num(n.x)}" y="${num(n.y)}" width="${num(n.w)}" height="${num(n.h)}" rx="${num(n.h / 2)}" ${stroke(color)}/>`,
  circle: (n, color) => ellipse(n, color),
  ellipse: (n, color) => ellipse(n, color),
  diamond: (n, color) =>
    `<polygon points="${num(n.x + n.w / 2)},${num(n.y)} ${num(n.x + n.w)},${num(n.y + n.h / 2)} ${num(n.x + n.w / 2)},${num(n.y + n.h)} ${num(n.x)},${num(n.y + n.h / 2)}" ${stroke(color)}/>`,
  triangle: (n, color) =>
    `<polygon points="${num(n.x + n.w / 2)},${num(n.y)} ${num(n.x + n.w)},${num(n.y + n.h)} ${num(n.x)},${num(n.y + n.h)}" ${stroke(color)}/>`,
  hexagon: (n, color) =>
    `<polygon points="${num(n.x + n.w * 0.22)},${num(n.y)} ${num(n.x + n.w * 0.78)},${num(n.y)} ${num(n.x + n.w)},${num(n.y + n.h / 2)} ${num(n.x + n.w * 0.78)},${num(n.y + n.h)} ${num(n.x + n.w * 0.22)},${num(n.y + n.h)} ${num(n.x)},${num(n.y + n.h / 2)}" ${stroke(color)}/>`,
  parallelogram: (n, color) => {
    const k = Math.min(n.h * 0.28, 22);
    return `<polygon points="${num(n.x + k)},${num(n.y)} ${num(n.x + n.w)},${num(n.y)} ${num(n.x + n.w - k)},${num(n.y + n.h)} ${num(n.x)},${num(n.y + n.h)}" ${stroke(color)}/>`;
  },
  cylinder: (n, color) => cylinder(n, color),
  document: (n, color) => documentShape(n, color),
};

function ellipse(n: PositionedNode, color: string): string {
  return `<ellipse cx="${num(n.x + n.w / 2)}" cy="${num(n.y + n.h / 2)}" rx="${num(n.w / 2)}" ry="${num(n.h / 2)}" ${stroke(color)}/>`;
}

function cylinder(n: PositionedNode, color: string): string {
  const ry = Math.min(n.h * 0.16, 15);
  return `<path d="M${num(n.x)},${num(n.y + ry)}
                       A${num(n.w / 2)},${num(ry)} 0 0 1 ${num(n.x + n.w)},${num(n.y + ry)}
                       L${num(n.x + n.w)},${num(n.y + n.h - ry)}
                       A${num(n.w / 2)},${num(ry)} 0 0 1 ${num(n.x)},${num(n.y + n.h - ry)} Z" ${stroke(color)}/>
          <path d="M${num(n.x)},${num(n.y + ry)} A${num(n.w / 2)},${num(ry)} 0 0 0 ${num(n.x + n.w)},${num(n.y + ry)}"
                fill="none" stroke="${color}" stroke-width="2" opacity="0.7"/>`;
}

function documentShape(n: PositionedNode, color: string): string {
  const d = n.h * 0.16;
  return `<path d="M${num(n.x)},${num(n.y)} L${num(n.x + n.w)},${num(n.y)} L${num(n.x + n.w)},${num(n.y + n.h - d)}
                   Q${num(n.x + n.w * 0.75)},${num(n.y + n.h - d * 2)} ${num(n.x + n.w * 0.5)},${num(n.y + n.h - d)}
                   T${num(n.x)},${num(n.y + n.h - d)} Z" ${stroke(color)}/>`;
}

/** Hasilkan elemen SVG bentuk untuk satu node. */
export function shapeSvg(n: PositionedNode, color: string): string {
  const render = SHAPE_RENDERERS[n.shape];
  return render(n, color);
}
