import type { CompileResult, TextMeasurer, EdgeStyle, ThemeColors, ThemeName } from './types';
import { parse } from './parser';
import { layout } from './layout';
import { renderDiagram } from '../rendering/diagram';
import { renderSequence } from './squence';
import { renderClassDiagram } from './class-diagram';
import { renderStateDiagram } from './state-diagram';
import { renderNetworkGraph } from './network-diagram';
import { THEMES } from './config';
import { renderErDiagram } from './er-diagram';
import { renderMindmap } from './mindmap';
import { renderTimeline } from './timeline';




export interface CompileOptions {
  readonly measure?: TextMeasurer;
  readonly edgeStyle?: EdgeStyle;
  readonly getIcon?: (name: string) => string | undefined;
  readonly theme?: ThemeColors;
  readonly themeName?: ThemeName;   // konvenien: pilih theme by name
}

export function compile(source: string, options: CompileOptions = {}): CompileResult {
  const theme: ThemeColors = options.theme ?? THEMES[options.themeName ?? 'dark'];

  if (source.trim().toLowerCase().startsWith('[sequence]')) {
    const errors: string[] = [];
    const result = renderSequence(source, errors, theme);
    return { markup: result.markup, viewBox: result.viewBox, errors };
  }

  if (source.trim().toLowerCase().startsWith('[er]')) {
    const r = renderErDiagram(source, options.edgeStyle ?? 'smooth', options.measure, theme);
    return { markup: r.markup, viewBox: r.viewBox, errors: r.errors };
  }

  if (source.trim().toLowerCase().startsWith('[mindmap]')) {
    const r = renderMindmap(source, options.edgeStyle ?? 'smooth', options.measure, theme);
    return { markup: r.markup, viewBox: r.viewBox, errors: r.errors };
  }

  if (source.trim().toLowerCase().startsWith('[timeline]')) {
    const r = renderTimeline(source, options.edgeStyle ?? 'smooth', options.measure, theme);
    return { markup: r.markup, viewBox: r.viewBox, errors: r.errors };
  }

  if (source.trim().toLowerCase().startsWith('[class]')) {
    const r = renderClassDiagram(source, options.edgeStyle ?? 'smooth', options.measure, theme);
    return { markup: r.markup, viewBox: r.viewBox, errors: r.errors };
  }

  if (source.trim().toLowerCase().startsWith('[state]')) {
    const r = renderStateDiagram(source, options.edgeStyle ?? 'smooth', options.measure, theme);
    return { markup: r.markup, viewBox: r.viewBox, errors: r.errors };
  }

  if (source.trim().toLowerCase().startsWith('[network]')) {
    const r = renderNetworkGraph(source, options.edgeStyle ?? 'smooth', options.measure, theme);
    return { markup: r.markup, viewBox: r.viewBox, errors: r.errors };
  }

  const { nodes, edges, errors, direction } = parse(source);
  if (nodes.length === 0) return { markup: '', viewBox: '0 0 100 100', errors };

  const geometry = layout(nodes, edges, direction, options.measure);
  const { markup, viewBox } = renderDiagram(geometry, options.edgeStyle ?? 'smooth', options.getIcon, theme);
  return { markup, viewBox, errors };
}