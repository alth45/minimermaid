import type { TextMeasurer } from '../core/types';

/* =========================================================
   CANVAS MEASURER — implementasi TextMeasurer berbasis
   `canvas.measureText()` untuk disuntik ke pipeline compile
   dari sisi UI (Issue #6). Layer core/rendering tetap bebas
   DOM: konteks 2D dibuat lewat OffscreenCanvas bila tersedia,
   dengan fallback elemen <canvas>. Hasil pengukuran di-cache
   per (teks, font) agar render ulang saat mengetik tetap murah.
   ========================================================= */

/** Font yang dipakai label node di SVG (harus sama dgn rendering/text.ts). */
const NODE_FONT = "500 14px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Subset konteks 2D yang dibutuhkan hanya untuk mengukur teks. */
type MeasureContext = Pick<CanvasRenderingContext2D, 'font' | 'measureText'>;

/** Buat konteks 2D sekali pakai khusus untuk pengukuran teks. */
function createMeasureContext(): MeasureContext | null {
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const off = new OffscreenCanvas(1, 1);
      return off.getContext('2d');
    }
    const el = document.createElement('canvas');
    return el.getContext('2d');
  } catch {
    return null; // lingkungan tanpa canvas → pemanggil memakai heuristik
  }
}

/**
 * Pengukur teks berbasis metrik font sebenarnya, dengan cache per
 * pasangan (teks, font). Mengembalikan `null` bila lingkungan tidak
 * menyediakan canvas sama sekali.
 */
export function createCanvasMeasurer(font: string = NODE_FONT): TextMeasurer | null {
  const ctx = createMeasureContext();
  if (!ctx) return null;
  ctx.font = font;
  const cache = new Map<string, number>();
  return {
    measure(text: string): number {
      const cached = cache.get(text);
      if (cached !== undefined) return cached;
      const width = ctx.measureText(text).width;
      cache.set(text, width);
      return width;
    },
  };
}
