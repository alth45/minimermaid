/* =========================================================
   Utilitas DOM — selektor ketat dengan error jelas.
   ========================================================= */

/** Ambil elemen berdasarkan selector; lempar error bila tidak ada. */
export function qs<T extends Element = HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Elemen tidak ditemukan: ${selector}`);
  return el;
}
