/* =========================================================
   APP — orkestrator: menghubungkan editor, preview, dan
   aksi toolbar. Merender pada frame berikutnya agar responsif
   ketika pengguna mengetik cepat.
   ========================================================= */

import { compile } from '../core/compile';
import type { TextMeasurer } from '../core/types';
import { createCanvasMeasurer } from './canvas-measurer';
import { Editor } from './editor';
import { Preview } from './preview';

/** Aplikasi utama MiniMermaid. */
export class App {
  private frame: number | null = null;
  /** Pengukur teks berbasis canvas (Issue #6); `null` bila tanpa lingkungan canvas. */
  private readonly measurer: TextMeasurer | null;

  constructor(
    private readonly editor: Editor,
    private readonly preview: Preview,
    downloadBtn: HTMLButtonElement,
  ) {
    this.measurer = createCanvasMeasurer();
    this.editor.onInput(() => this.scheduleRender());
    downloadBtn.addEventListener('click', () => this.downloadSvg());
  }

  /** Render awal dengan kode contoh bawaan. */
  start(initialSource: string): void {
    this.editor.value = initialSource;
    this.renderNow();
  }

  /** Jadwalkan render pada frame berikutnya (debounce alami). */
  private scheduleRender(): void {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.renderNow();
    });
  }

  private renderNow(): void {
    // Suntikkan measurer canvas bila tersedia; tanpa itu compile() memakai
    // heuristik bawaan sehingga pipeline tetap jalan di lingkungan non-browser.
    this.preview.render(compile(this.editor.value, this.measurer ? { measure: this.measurer } : {}));
  }

  /** Unduh SVG hasil render saat ini. */
  private downloadSvg(): void {
    const blob = new Blob([this.canvasMarkup()], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Ambil markup SVG final dari kanvas. */
  private canvasMarkup(): string {
    const canvas = document.getElementById('canvas');
    return canvas ? canvas.outerHTML : '';
  }
}
