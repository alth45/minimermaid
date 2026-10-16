/* =========================================================
   Utilitas SVG murni — escape dan pemformatan angka.
   ========================================================= */

/** Escape karakter XML berbahaya dalam teks/atribut SVG. */
export function escapeXml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Format angka: buang desimal nol untuk markup yang rapi. */
export function num(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}
