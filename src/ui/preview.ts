import type { CompileResult } from '../core/types';

/* =========================================================
   PREVIEW — menampilkan markup SVG + daftar error di kanvas.
   ========================================================= */

/** Kontrol panel pratinjau diagram. */
export class Preview {
  constructor(
    private readonly canvas: SVGSVGElement,
    private readonly errorBox: HTMLElement,
  ) {}

  /** Tampilkan hasil compile terbaru. */
  render(result: CompileResult): void {
    this.canvas.setAttribute('viewBox', result.viewBox);
    this.canvas.innerHTML = result.markup;

    // Pakai textContent agar aman dari injeksi markup dari label user.
    this.errorBox.replaceChildren(
      ...result.errors.map((message) => {
        const div = document.createElement('div');
        div.textContent = `⚠ ${message}`;
        return div;
      }),
    );
  }
}
