import type { CompileResult, TextMeasurer } from './types';
import { parse } from './parser';
import { layout } from './layout';
import { renderDiagram } from '../rendering/diagram';

/* =========================================================
   PIPELINE UTAMA — teks sumber → markup SVG siap tayang.
   Menggabungkan parser, layout, dan renderer tanpa menyentuh
   DOM, sehingga mudah dites unit dan dipakai ulang.
   ========================================================= */

/** Opsi pipeline compile (Issue #6). */
export interface CompileOptions {
  /**
   * Pengukur lebar teks yang disuntik ke layout. Default: heuristik
   * `panjang × charWidth`. UI menyuntik measurer berbasis
   * `canvas.measureText()` agar label CJK/emoji tidak tumpah dari node.
   */
  readonly measure?: TextMeasurer;
}

/** Compile sumber teks menjadi markup SVG + daftar error. */
export function compile(source: string, options: CompileOptions = {}): CompileResult {
  const { nodes, edges, errors, direction } = parse(source);

  if (nodes.length === 0) {
    return { markup: '', viewBox: '0 0 100 100', errors };
  }

  const geometry = layout(nodes, edges, direction, options.measure);
  const { markup, viewBox } = renderDiagram(geometry);
  return { markup, viewBox, errors };
}
