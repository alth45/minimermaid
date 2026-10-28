import type { CompileResult, TextMeasurer, EdgeStyle } from './types';
import { parse } from './parser';
import { layout } from './layout';
import { renderDiagram } from '../rendering/diagram';

export interface CompileOptions {
  readonly measure?: TextMeasurer;
  readonly edgeStyle?: EdgeStyle;
  readonly getIcon?: (name: string) => string | undefined;
}

export function compile(source: string, options: CompileOptions = {}): CompileResult {
  const { nodes, edges, errors, direction } = parse(source);

  if (nodes.length === 0) {
    return { markup: '', viewBox: '0 0 100 100', errors };
  }

  const geometry = layout(nodes, edges, direction, options.measure);
  const { markup, viewBox } = renderDiagram(geometry, options.edgeStyle ?? 'smooth', options.getIcon);
  
  return { markup, viewBox, errors };
}