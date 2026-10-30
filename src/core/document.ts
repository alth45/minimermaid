/* =========================================================
   DOCUMENT I/O — serialisasi & deserialisasi .mmd.json.
   Layer core: murni, tanpa DOM.
   ========================================================= */

import type {
    DiagramType, EdgeStyle, MiniMermaidDocument, ThemeName,
} from './types';
import { parse } from './parser';

export const DOC_VERSION = '1.0';
export const DOC_GENERATOR = 'MiniMermaid';

/** Deteksi tipe diagram dari baris pertama sumber. */
export function detectDiagramType(source: string): DiagramType {
    const first = source.trim().toLowerCase();
    if (first.startsWith('[sequence]')) return 'sequence';
    if (first.startsWith('[er]')) return 'er';
    if (first.startsWith('[mindmap]')) return 'mindmap';
    if (first.startsWith('[timeline]')) return 'timeline';
    if (first.startsWith('[class]')) return 'class';
    if (first.startsWith('[state]')) return 'state';
    if (first.startsWith('[network]')) return 'network';
    return 'flowchart';
}

export interface ExportDocumentOptions {
    readonly theme?: ThemeName;
    readonly edgeStyle?: EdgeStyle;
    /** Sertakan hasil parse (nodes & edges) untuk flowchart. Default: true. */
    readonly includeModel?: boolean;
}

/** Bangun objek dokumen dari source + opsi. */
export function exportDocument(
    source: string,
    options: ExportDocumentOptions = {},
): MiniMermaidDocument {
    const type = detectDiagramType(source);
    const includeModel = options.includeModel ?? true;

    let model: MiniMermaidDocument['model'];
    if (includeModel && type === 'flowchart') {
        const r = parse(source);
        model = { direction: r.direction, nodes: r.nodes, edges: r.edges };
    }

    return {
        version: DOC_VERSION,
        generator: DOC_GENERATOR,
        type,
        source,
        theme: options.theme ?? 'dark',
        edgeStyle: options.edgeStyle ?? 'smooth',
        ...(model ? { model } : {}),
    };
}

/** Serialisasi ke string JSON pretty-print (mudah dibaca & diedit tangan). */
export function serializeDocument(doc: MiniMermaidDocument): string {
    return JSON.stringify(doc, null, 2);
}

export interface ImportResult {
    readonly source: string;
    readonly theme: ThemeName;
    readonly edgeStyle: EdgeStyle;
    readonly type: DiagramType;
    readonly errors: string[];
}

/**
 * Parse string JSON menjadi bagian-bagian yang bisa langsung diterapkan.
 * Errors bersifat non-fatal — tetap kembalikan apa pun yang bisa dipakai.
 */
export function parseDocumentJson(raw: string): ImportResult {
    const errors: string[] = [];
    let parsed: unknown;

    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        return {
            source: '', theme: 'dark', edgeStyle: 'smooth', type: 'flowchart',
            errors: [`JSON tidak valid: ${(e as Error).message}`],
        };
    }

    if (!parsed || typeof parsed !== 'object') {
        return {
            source: '', theme: 'dark', edgeStyle: 'smooth', type: 'flowchart',
            errors: ['Dokumen bukan objek JSON.'],
        };
    }

    const obj = parsed as Record<string, unknown>;
    const source = typeof obj.source === 'string' ? obj.source : '';
    if (!source.trim()) errors.push('Field "source" tidak ditemukan atau kosong.');

    const theme: ThemeName = obj.theme === 'light' ? 'light' : 'dark';

    const edgeStyleRaw = obj.edgeStyle;
    const edgeStyle: EdgeStyle =
        edgeStyleRaw === 'step' || edgeStyleRaw === 'straight'
            ? edgeStyleRaw
            : 'smooth';

    const type = detectDiagramType(source);

    if (typeof obj.type === 'string' && obj.type !== type) {
        errors.push(`Field "type" = "${obj.type}" tidak cocok dengan source (terdeteksi "${type}").`);
    }
    if (typeof obj.version === 'string' && obj.version !== DOC_VERSION) {
        errors.push(`Versi dokumen "${obj.version}" berbeda dari versi aplikasi "${DOC_VERSION}".`);
    }

    return { source, theme, edgeStyle, type, errors };
}