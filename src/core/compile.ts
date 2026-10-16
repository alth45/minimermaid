import type { CompileResult } from './types';
import { parse } from './parser';
import { layout } from './layout';
import { renderDiagram } from '../rendering/diagram';

/* =========================================================
   PIPELINE UTAMA — teks sumber → markup SVG siap tayang.
   Menggabungkan parser, layout, dan renderer tanpa menyentuh
   DOM, sehingga mudah dites unit dan dipakai ulang.
   ========================================================= */

/** Compile sumber teks menjadi markup SVG + daftar error. */
export function compile(source: string): CompileResult {
  const { nodes, edges, errors } = parse(source);

  if (nodes.length === 0) {
    return { markup: '', viewBox: '0 0 100 100', errors };
  }

  const geometry = layout(nodes, edges);
  const { markup, viewBox } = renderDiagram(geometry);
  return { markup, viewBox, errors };
}
