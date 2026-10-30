import { compile } from './core/compile';
import type { CompileOptions } from './core/compile';
import {
  exportDocument, serializeDocument, parseDocumentJson,
} from './core/document';
import type {
  ExportDocumentOptions, ImportResult,
} from './core/document';
import { createCanvasMeasurer } from './ui/canvas-measurer';
import { icons } from 'lucide';

// Tetap ekspor tipe agar user TypeScript bisa menggunakan interface-nya
export * from './core/types';
export type { CompileOptions };

// Fungsi helper ikon
function getLucideIcon(name: string): string | undefined {
  const key = name.replace(/(^\w|-\w)/g, (g) => g.replace('-', '').toUpperCase());
  const icon = (icons as any)[key] || (icons as any)[name];
  if (!icon) return undefined;
  return (icon as any[]).map((child: any) => {
    const tag = child[0];
    const attrs = Object.entries(child[1] || {})
      .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}="${v}"`)
      .join(' ');
    return `<${tag} ${attrs} />`;
  }).join('');
}

// Kelas Utama
class MiniMermaid {
  private static measurer = createCanvasMeasurer();
  static getLucideIcon = getLucideIcon;

  static render(source: string, options: CompileOptions = {}): { svg: string; errors: string[] } {
    const opts = { ...options };
    if (opts.measure === undefined && MiniMermaid.measurer) opts.measure = MiniMermaid.measurer;
    const result = compile(source, opts);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${result.viewBox}" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%;">${result.markup}</svg>`;
    return { svg, errors: result.errors };
  }

  static renderTo(target: HTMLElement | string, source: string, options: CompileOptions = {}): void {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) { console.error('MiniMermaid: Elemen target tidak ditemukan.'); return; }
    const { svg, errors } = MiniMermaid.render(source, options);
    el.innerHTML = svg;
    if (errors.length > 0) console.warn('MiniMermaid Parser Errors:', errors);
  }

  // --- Document API ---
  static exportJson(source: string, options: ExportDocumentOptions = {}): string {
    return serializeDocument(exportDocument(source, options));
  }

  static importJson(raw: string): ImportResult {
    return parseDocumentJson(raw);
  }
}

export default MiniMermaid;