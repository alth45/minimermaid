/* =========================================================
   APP — orkestrator: menghubungkan editor, preview, dan
   aksi toolbar. Merender pada frame berikutnya agar responsif
   ketika pengguna mengetik cepat.
   ========================================================= */

import { compile } from '../core/compile';
import { Editor } from './editor';
import { Preview } from './preview';

/** Aplikasi utama MiniMermaid. */
export class App {
  private frame: number | null = null;

  constructor(
    private readonly editor: Editor,
    private readonly preview: Preview,
    downloadBtn: HTMLButtonElement,
  ) {
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
    this.preview.render(compile(this.editor.value));
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
