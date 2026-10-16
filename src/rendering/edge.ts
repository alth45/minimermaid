import type { PositionedNode } from '../core/types';
import { LAYOUT } from '../core/config';
import { num } from './svg-utils';

/* =========================================================
   RENDERER EDGE — kurva bezier antar node dengan ujung
   panah. Arah sambungan mengikuti orientasi layout:
   - vertikal  : dasar node sumber → puncak node tujuan
   - horizontal: sisi kanan node sumber → sisi kiri node tujuan
   Edge percabangan (dua edge dari node yang sama) digambar
   menyimpang ke kiri/kanan lalu dilengkapi label kecil ("Ya"/"Tidak").
   ========================================================= */

/** Anotasi posisi edge dalam sepasang cabang. */
export type BranchSide = 'yes' | 'no';

const LABEL_FONT_SIZE = 12;

/**
 * Pilih sisi keluar/masuk node untuk edge antar dua node yang posisinya
 * sudah diketahui — dipakai agar edge cabang (sumber → sisi ya/tidak yang
 * letaknya menyamping) tetap tersambung ke sisi terdekat.
 */
function anchorPair(
  a: PositionedNode,
  b: PositionedNode,
  horizontal: boolean,
): { x1: number; y1: number; x2: number; y2: number; along: 'main' | 'cross' } {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  // Edge "melintang" bila perpindahan terbesar terjadi tegak lurus arah layout.
  const crosswise = horizontal
    ? Math.abs(bcy - acy) > Math.abs(bcx - acx)
    : Math.abs(bcx - acx) > Math.abs(bcy - acy);
  if (!crosswise) {
    // Kasus standar: mengikuti arah utama layout.
    return horizontal
      ? { x1: a.x + a.w, y1: acy, x2: b.x - 2, y2: bcy, along: 'main' }
      : { x1: acx, y1: a.y + a.h, x2: bcx, y2: b.y - 2, along: 'main' };
  }
  if (horizontal) {
    // Layout horizontal, tujuan di atas/bawah sumber → keluar dari sisi atas/bawah.
    const up = bcy < acy;
    return {
      x1: acx,
      y1: up ? a.y : a.y + a.h,
      x2: bcx,
      y2: up ? b.y + b.h + 2 : b.y - 2,
      along: 'cross',
    };
  }
  // Layout vertikal, tujuan di kiri/kanan sumber → keluar dari sisi kiri/kanan.
  const left = bcx < acx;
  return {
    x1: left ? a.x : a.x + a.w,
    y1: acy,
    x2: left ? b.x + b.w + 2 : b.x - 2,
    y2: bcy,
    along: 'cross',
  };
}

/** Hasilkan elemen <path> (+ label opsional) antara dua node. */
export function edgeSvg(
  a: PositionedNode,
  b: PositionedNode,
  horizontal = false,
  branch?: BranchSide,
  label?: string,
): string {
  let d: string;
  let lx = 0;
  let ly = 0;
  const midX = (a.x + a.w / 2 + b.x + b.w / 2) / 2;
  const midY = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
  const { x1, y1, x2, y2, along } = anchorPair(a, b, horizontal);

  if (along === 'cross') {
    // Kurva yang berpindah melintang: kendali mengikuti sumbu utama perpindahan.
    if (horizontal) {
      const c = Math.max(24, Math.abs(y2 - y1) * 0.45);
      const dir = y2 > y1 ? 1 : -1;
      d = `M${num(x1)},${num(y1)} C${num(x1)},${num(y1 + dir * c)} ${num(x2)},${num(y2 - dir * c)} ${num(x2)},${num(y2)}`;
    } else {
      const c = Math.max(24, Math.abs(x2 - x1) * 0.45);
      const dir = x2 > x1 ? 1 : -1;
      d = `M${num(x1)},${num(y1)} C${num(x1 + dir * c)},${num(y1)} ${num(x2 - dir * c)},${num(y2)} ${num(x2)},${num(y2)}`;
    }
    lx = midX;
    ly = midY;
  } else if (horizontal) {
    const c = Math.max(24, (x2 - x1) * 0.45);
    if (branch) {
      // Dua edge dari titik yang sama: tekuk ke atas (ya) / bawah (tidak).
      const bend = branch === 'yes' ? -LAYOUT.gap * 0.45 : LAYOUT.gap * 0.45;
      d = `M${num(x1)},${num(y1)} C${num(x1 + c)},${num(y1 + bend)} ${num(x2 - c)},${num(y2 + bend)} ${num(x2)},${num(y2)}`;
      lx = midX;
      ly = midY + bend * 0.75;
    } else {
      d = `M${num(x1)},${num(y1)} C${num(x1 + c)},${num(y1)} ${num(x2 - c)},${num(y2)} ${num(x2)},${num(y2)}`;
      lx = midX;
      ly = midY;
    }
  } else {
    const c = Math.max(24, (y2 - y1) * 0.45);
    if (branch) {
      const bend = branch === 'yes' ? -LAYOUT.gap * 0.45 : LAYOUT.gap * 0.45;
      d = `M${num(x1)},${num(y1)} C${num(x1 + bend)},${num(y1 + c)} ${num(x2 + bend)},${num(y2 - c)} ${num(x2)},${num(y2)}`;
      lx = midX + bend * 0.75;
      ly = midY;
    } else {
      d = `M${num(x1)},${num(y1)} C${num(x1)},${num(y1 + c)} ${num(x2)},${num(y2 - c)} ${num(x2)},${num(y2)}`;
      lx = midX;
      ly = midY;
    }
  }

  const path = `<path d="${d}" fill="none" stroke="#7d8590" stroke-width="2"
                stroke-linecap="round" marker-end="url(#arrow)"/>`;
  if (!label || !branch) return path;

  // Label kecil di tengah edge cabang, dengan latar supaya tidak menimpa garis.
  const w = Math.max(LAYOUT.branchLabelMinW, label.length * LABEL_FONT_SIZE * 0.66 + 10);
  const h = LABEL_FONT_SIZE + 8;
  const bg = `<rect x="${num(lx - w / 2)}" y="${num(ly - h / 2)}" width="${num(w)}" height="${num(h)}"
                   rx="6" fill="#0d1117" opacity="0.9"/>`;
  const text = `<text x="${num(lx)}" y="${num(ly + LABEL_FONT_SIZE * 0.35)}" text-anchor="middle"
                     font-size="${LABEL_FONT_SIZE}" fill="#c9d1d9">${escapeXml(label)}</text>`;
  return `${path}${bg}${text}`;
}

/** Escap karakter XML untuk label. */
function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Definisi <defs> berisi marker panah (dipanggil sekali per kanvas). */
export const ARROW_DEFS = `<defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#7d8590"/>
    </marker>
  </defs>`;