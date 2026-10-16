import type { PositionedNode } from '../core/types';
import { LAYOUT } from '../core/config';
import { num } from './svg-utils';

/* =========================================================
   RENDERER EDGE — kurva bezier antar node dengan ujung
   panah. Arah sambungan mengikuti orientasi layout:
   - vertikal  : dasar node sumber → puncak node tujuan
   - horizontal: sisi kanan node sumber → sisi kiri node tujuan
   Edge percabangan HANYA muncul bila kode memakai `[cabang]`;
   bentuknya selalu siku-rapi (elbow) mengikuti grid kolom:
   - vertikal  : keluar dari dasar sumber, belok mendatar, masuk ke puncak tujuan
   - horizontal: keluar dari kanan sumber, belok vertikal, masuk ke kiri tujuan
   Tanpa `[cabang]` (dan tanpa direktif arah) semua edge digambar
   lurus vertikal default yang rapi.
   ========================================================= */

/** Anotasi posisi edge dalam sepasang cabang. */
export type BranchSide = 'yes' | 'no';

const LABEL_FONT_SIZE = 12;

/**
 * Pilih sisi keluar/masuk node untuk edge antar dua node yang posisinya
 * sudah diketahui — dipakai agar edge cabang tetap tersambung ke sisi terdekat.
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

/** Titik tengah kurva cubic bezier pada parameter t = 0.5. */
function bezierMidpoint(
  p0x: number, p0y: number,
  c1x: number, c1y: number,
  c2x: number, c2y: number,
  p1x: number, p1y: number,
): { mx: number; my: number } {
  // B(0.5) = (p0 + 3c1 + 3c2 + p1) / 8
  return {
    mx: (p0x + 3 * c1x + 3 * c2x + p1x) / 8,
    my: (p0y + 3 * c1y + 3 * c2y + p1y) / 8,
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

  if (branch) {
    // ===== EDGE CABANG (hanya untuk node [cabang]) — elbow mengikuti grid =====
    if (horizontal) {
      // Grid baru: sumber di lajur-1, ya/tidak di lajur-2 (atas/bawah).
      // Keluar dari SISI KANAN sumber, belok vertikal, masuk ke SISI KIRI tujuan.
      const x1 = a.x + a.w;
      const y1 = a.y + a.h / 2;
      const x2 = b.x - 2;
      const y2 = b.y + b.h / 2;
      const bendX = x1 + Math.max(16, (x2 - x1) * 0.5);
      d = `M${num(x1)},${num(y1)} C${num(bendX)},${num(y1)} ${num(bendX)},${num(y2)} ${num(x2)},${num(y2)}`;
      const mid = bezierMidpoint(x1, y1, bendX, y1, bendX, y2, x2, y2);
      lx = mid.mx;
      ly = mid.my;
    } else {
      // Grid baru: sumber di baris-1, ya|tidak di baris-2 (kiri/kanan).
      // Keluar dari DASAR sumber, belok mendatar, masuk ke PUNCAK tujuan.
      const x1 = a.x + a.w / 2;
      const y1 = a.y + a.h;
      const x2 = b.x + b.w / 2;
      const y2 = b.y - 2;
      const bendY = y1 + Math.max(14, (y2 - y1) * 0.4);
      d = `M${num(x1)},${num(y1)} C${num(x1)},${num(bendY)} ${num(x2)},${num(bendY)} ${num(x2)},${num(y2)}`;
      const mid = bezierMidpoint(x1, y1, x1, bendY, x2, bendY, x2, y2);
      lx = mid.mx;
      ly = mid.my;
    }
  } else {
    // ===== EDGE BIASA (rantai linear) — selalu searah sumbu utama =====
    const { x1, y1, x2, y2 } = anchorPair(a, b, horizontal);
    if (horizontal) {
      const c = Math.max(24, (x2 - x1) * 0.45);
      d = `M${num(x1)},${num(y1)} C${num(x1 + c)},${num(y1)} ${num(x2 - c)},${num(y2)} ${num(x2)},${num(y2)}`;
    } else {
      const c = Math.max(24, (y2 - y1) * 0.45);
      d = `M${num(x1)},${num(y1)} C${num(x1)},${num(y1 + c)} ${num(x2)},${num(y2 - c)} ${num(x2)},${num(y2)}`;
    }
    lx = midX;
    ly = midY;
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