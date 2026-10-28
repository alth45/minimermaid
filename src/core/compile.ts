import type { CompileResult, TextMeasurer, EdgeStyle } from './types';
import { parse } from './parser';
import { layout } from './layout';
import { renderDiagram } from '../rendering/diagram';
import { renderSequence } from './squence'; // <-- Import engine baru
import { renderClassDiagram } from './class-diagram';
import { renderStateDiagram } from './state-diagram'; // <-- Import baru
import { renderNetworkGraph } from './network-diagram'; // <-- Import baru



export interface CompileOptions {
  readonly measure?: TextMeasurer;
  readonly edgeStyle?: EdgeStyle;
  readonly getIcon?: (name: string) => string | undefined;
}



export function compile(source: string, options: CompileOptions = {}): CompileResult {
  // DETEKSI SEQUENCE DIAGRAM
  if (source.trim().toLowerCase().startsWith('[sequence]')) {
    const errors: string[] = [];
    const result = renderSequence(source, errors);
    return { markup: result.markup, viewBox: result.viewBox, errors };
  }

  if (source.trim().toLocaleLowerCase().startsWith('[class]')) {
    const result = renderClassDiagram(source, options.edgeStyle ?? 'smooth', options.measure);
    return { markup: result.markup, viewBox: result.viewBox, errors: result.errors };
  }


  if (source.trim().toLocaleLowerCase().startsWith('[state]')) {
    const result = renderStateDiagram(source, options.edgeStyle ?? 'smooth', options.measure);
    return { markup: result.markup, viewBox: result.viewBox, errors: result.errors };
  }
  if(source.trim().toLowerCase().startsWith('[network]')){
    const result = renderNetworkGraph(source, options.edgeStyle ?? 'smooth', options.measure);
    return {markup: result.markup, viewBox: result.viewBox, errors: result.errors};
  }
  // JIKA BUKAN, LANJUTKAN KE FLOWCHART BIASA
  const { nodes, edges, errors, direction } = parse(source);

  if (nodes.length === 0) {
    return { markup: '', viewBox: '0 0 100 100', errors };
  }

  const geometry = layout(nodes, edges, direction, options.measure);
  const { markup, viewBox } = renderDiagram(geometry, options.edgeStyle ?? 'smooth', options.getIcon);
  
  return { markup, viewBox, errors };
}