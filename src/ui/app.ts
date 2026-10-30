import { compile } from '../core/compile';
import type { TextMeasurer, EdgeStyle, ThemeName } from '../core/types';
import { THEMES } from '../core/config';
import { exportDocument, parseDocumentJson, detectDiagramType } from '../core/document';
import { parse } from '../core/parser';
import { createCanvasMeasurer } from './canvas-measurer';
import { Editor } from './editor';
import { Preview } from './preview';
import { createIcons, icons } from 'lucide';
import { encodeSource, STORAGE_KEYS } from './url-state';
import { downloadDocument, pickJsonFile, readDroppedFile } from './document-io';
import { PropertyPanel } from './property-panel';
import type { NodeSpec, ShapeKind } from '../core/types';
import { Minimap } from './minimap';


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

export class App {
  private frame: number | null = null;
  private readonly measurer: TextMeasurer | null;
  private edgeStyle: EdgeStyle = 'smooth';
  private themeName: ThemeName = 'dark';
  private readonly styleSelect: HTMLSelectElement;

  // --- Batch 5A: state ---
  private selectedIdx: number | null = null;
  private readonly panel: PropertyPanel;
  private readonly minimap: Minimap;      // ← TAMBAH


  constructor(
    private readonly editor: Editor,
    private readonly preview: Preview,
    downloadSvgBtn: HTMLButtonElement,
    downloadPngBtn: HTMLButtonElement,
    toggleEditorBtn: HTMLButtonElement,
    styleSelect: HTMLSelectElement,
    shareBtn: HTMLButtonElement,
    copySvgBtn: HTMLButtonElement,
    zoomInBtn: HTMLButtonElement,
    zoomOutBtn: HTMLButtonElement,
    zoomResetBtn: HTMLButtonElement,
    themeBtn: HTMLButtonElement,
    importJsonBtn: HTMLButtonElement,
    exportJsonBtn: HTMLButtonElement,
  ) {
    this.styleSelect = styleSelect;
    this.measurer = createCanvasMeasurer();
    this.editor.onInput(() => this.scheduleRender());

    downloadSvgBtn.addEventListener('click', () => this.downloadSvg());
    downloadPngBtn.addEventListener('click', () => this.downloadPng());
    shareBtn.addEventListener('click', () => { void this.share(); });
    copySvgBtn.addEventListener('click', () => { void this.copySvg(); });

    zoomInBtn.addEventListener('click', () => this.preview.zoomIn());
    zoomOutBtn.addEventListener('click', () => this.preview.zoomOut());
    zoomResetBtn.addEventListener('click', () => this.preview.resetView());

    themeBtn.addEventListener('click', () => this.toggleTheme());
    importJsonBtn.addEventListener('click', () => { void this.handleImportJson(); });
    exportJsonBtn.addEventListener('click', () => this.handleExportJson());

    styleSelect.addEventListener('change', (e) => {
      this.edgeStyle = (e.target as HTMLSelectElement).value as EdgeStyle;
      this.scheduleRender();
    });

    toggleEditorBtn.addEventListener('click', () => this.toggleEditorUI());

    this.setupDragDrop();

    // --- Batch 5A: Property panel + selection wiring ---
    const previewContainer = this.preview.svgElement.parentElement as HTMLElement | null;
    if (!previewContainer) {
      throw new Error('Preview container tidak ditemukan');
    }
    this.panel = new PropertyPanel(previewContainer);
    this.panel.onApply = (node) => this.applyNodeEdit(node);
    this.panel.onClose = () => {
      this.selectedIdx = null;
      this.preview.highlightNode(null);
    };
    this.preview.onNodeClick = (idx) => this.handleNodeClick(idx);
    // --- Batch 5B: Minimap ---
    this.minimap = new Minimap(previewContainer);
    this.minimap.onNavigate = (cx, cy) => this.preview.centerOn(cx, cy);
    this.preview.onViewChange = () => {
      const state = this.preview.getViewState();
      this.minimap.updateViewport(state.current, state.full);
    };
  }



  start(initialSource: string, initialTheme: ThemeName = 'dark'): void {
    this.editor.value = initialSource;
    this.applyTheme(initialTheme);
    this.renderNow();
  }

  public toggleEditorUI(): void {
    const appEl = document.querySelector('.app');
    if (!appEl) return;
    const isHidden = appEl.classList.toggle('hide-editor');
    const btn = document.querySelector<HTMLButtonElement>('#toggle-editor');
    if (btn) {
      btn.innerHTML = isHidden
        ? `<i data-lucide="eye"></i> <span id="toggle-text">Tampilkan Kode</span>`
        : `<i data-lucide="eye-off"></i> <span id="toggle-text">Sembunyikan Kode</span>`;
      createIcons({ icons });
    }
    setTimeout(() => this.scheduleRender(), 350);
  }

  // --- Publik ---
  getSource(): string { return this.editor.value; }
  getTheme(): ThemeName { return this.themeName; }
  getEdgeStyle(): EdgeStyle { return this.edgeStyle; }

  setSource(source: string): void {
    this.editor.value = source;
    this.renderNow();
  }

  setEdgeStyle(style: EdgeStyle): void {
    if (style === this.edgeStyle) return;
    this.styleSelect.value = style;
    this.styleSelect.dispatchEvent(new Event('change'));
  }

  // --- Render pipeline ---
  private scheduleRender(): void {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.renderNow();
    });
  }

  private renderNow(): void {
    const result = compile(this.editor.value, {
      measure: this.measurer ?? undefined,
      edgeStyle: this.edgeStyle,
      getIcon: getLucideIcon,
      themeName: this.themeName,
    });

    // Minimap di-render dulu agar `full` siap sebelum `preview.render()`
    // memicu onViewChange.
    this.minimap.render(result);
    this.preview.render(result);

    if (this.selectedIdx !== null) {
      this.preview.highlightNode(this.selectedIdx);
    }
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.source, this.editor.value);
      localStorage.setItem(STORAGE_KEYS.edgeStyle, this.edgeStyle);
      localStorage.setItem(STORAGE_KEYS.theme, this.themeName);
    } catch { /* ignore */ }
  }

  // --- JSON Export ---
  public handleExportJson(): void {
    const doc = exportDocument(this.editor.value, {
      theme: this.themeName,
      edgeStyle: this.edgeStyle,
      includeModel: true,
    });
    downloadDocument(doc);
    this.toast('Dokumen .mmd.json diunduh ✓');
  }

  // --- JSON Import ---
  public async handleImportJson(): Promise<void> {
    const raw = await pickJsonFile();
    if (raw === null) return;
    this.applyImportedJson(raw);
  }

  public zoomIn(): void { this.preview.zoomIn(); }
  public zoomOut(): void { this.preview.zoomOut(); }
  public resetZoom(): void { this.preview.resetView(); }

  public toggleThemeUI(): void {
    this.toggleTheme();
  }

  public forceRender(): void {
    this.renderNow();
    this.toast('Dirender ulang ✓');
  }

  private applyImportedJson(raw: string): void {
    const result = parseDocumentJson(raw);
    if (!result.source) {
      this.toast(result.errors[0] ?? 'Dokumen tidak valid', true);
      return;
    }
    this.editor.value = result.source;
    this.applyTheme(result.theme);
    this.setEdgeStyle(result.edgeStyle);
    this.renderNow();

    if (result.errors.length > 0) {
      console.warn('MiniMermaid import warnings:', result.errors);
      this.toast(`Diimpor dengan ${result.errors.length} peringatan`, true);
    } else {
      this.toast('Dokumen berhasil diimpor ✓');
    }
  }

  // --- Drag & drop .mmd.json ---
  private setupDragDrop(): void {
    const el = this.preview.svgElement.closest('.preview') as HTMLElement | null;
    if (!el) return;

    const stop = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };

    el.addEventListener('dragenter', (e) => {
      stop(e);
      el.classList.add('drag-over');
    });
    el.addEventListener('dragover', (e) => {
      stop(e);
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });
    el.addEventListener('dragleave', (e) => {
      stop(e);
      if (e.target === el) el.classList.remove('drag-over');
    });
    el.addEventListener('drop', async (e) => {
      stop(e);
      el.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (!file.name.endsWith('.json')) {
        this.toast('Hanya file .json yang diterima', true);
        return;
      }
      const raw = await readDroppedFile(file);
      if (raw === null) { this.toast('Gagal membaca file', true); return; }
      this.applyImportedJson(raw);
    });
  }

  // --- Theme ---
  private toggleTheme(): void {
    this.applyTheme(this.themeName === 'dark' ? 'light' : 'dark');
    this.renderNow();
  }

  private applyTheme(name: ThemeName): void {
    this.themeName = name;
    document.body.setAttribute('data-theme', name);
    const btn = document.querySelector<HTMLButtonElement>('#theme-btn');
    if (btn) {
      btn.innerHTML = name === 'dark'
        ? `<i data-lucide="sun"></i> Terang`
        : `<i data-lucide="moon"></i> Gelap`;
      createIcons({ icons });
    }
  }

  // --- Share & Copy ---
  public async share(): Promise<void> {
    const encoded = encodeSource(this.editor.value);
    const base = location.href.split('#')[0];
    const url = `${base}#d=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      this.toast('Tautan berbagi disalin ✓');
    } catch {
      prompt('Salin tautan berikut:', url);
    }
  }

  private async copySvg(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.preview.svgElement.outerHTML);
      this.toast('SVG disalin ✓');
    } catch {
      this.toast('Gagal menyalin SVG', true);
    }
  }

  private toast(message: string, isError = false): void {
    const el = document.createElement('div');
    el.className = 'toast' + (isError ? ' toast-error' : '');
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 250);
    }, 2200);
  }

  // --- Download SVG & PNG ---
  public downloadSvg(): void {
    const svgString = this.preview.svgElement.outerHTML;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'diagram.svg'; a.click();
    URL.revokeObjectURL(url);
  }

  public downloadPng(): void {
    const svgElement = this.preview.svgElement;
    let svgString = svgElement.outerHTML;
    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgString = svgString.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    }
    const viewBoxStr = svgElement.getAttribute('viewBox') || '0 0 800 600';
    const [, , vbW, vbH] = viewBoxStr.split(' ').map(Number);
    if (!vbW || !vbH) return;

    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = vbW * scale;
    canvas.height = vbH * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = THEMES[this.themeName].canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl; a.download = 'diagram.png'; a.click();
    };
    img.onerror = (e) => {
      console.error('Gagal memproses PNG', e);
      URL.revokeObjectURL(url);
      alert('Gagal mengunduh PNG.');
    };
    img.src = url;
  }

  // =========================================================
  // BATCH 5A — Node selection + property panel
  // =========================================================

  private handleNodeClick(idx: number | null): void {
    if (idx === null) {
      this.clearSelection();
      return;
    }
    if (detectDiagramType(this.editor.value) !== 'flowchart') {
      return; // hanya flowchart untuk saat ini
    }
    const parsed = parse(this.editor.value);
    const node = parsed.nodes[idx];
    if (!node || node.line === undefined) {
      this.clearSelection();
      return;
    }
    if (node.side !== undefined) {
      this.toast('Node sisi (ya/tidak) tidak bisa diedit via panel', true);
      return;
    }
    this.selectedIdx = idx;
    this.preview.highlightNode(idx);
    this.panel.open(node);
  }

  private clearSelection(): void {
    this.selectedIdx = null;
    this.preview.highlightNode(null);
    this.panel.close();
  }

  private applyNodeEdit(updated: NodeSpec): void {
    const idx = this.selectedIdx;
    if (idx === null) return;

    const parsed = parse(this.editor.value);
    const node = parsed.nodes[idx];
    if (!node || node.line === undefined) {
      this.toast('Baris sumber node tidak ditemukan', true);
      this.panel.close();
      return;
    }

    const lines = this.editor.value.split(/\r?\n/);
    const lineIdx = node.line - 1;
    const oldLine = lines[lineIdx];
    if (oldLine === undefined) return;

    const prefix = extractLinePrefix(oldLine);
    const endToken = extractEndToken(oldLine);
    lines[lineIdx] = prefix + serializeNodeLine(updated, endToken);
    this.editor.value = lines.join('\n');

    this.renderNow();
    this.preview.highlightNode(idx);
    this.toast('Node diperbarui ✓');
  }
}

/* =========================================================
   BATCH 5A — helper: rekonstruksi baris sumber node
   ========================================================= */

/** Ambil prefix sebelum `->[`, mis. indentasi atau `[cabang]`. */
function extractLinePrefix(line: string): string {
  const cabang = /^(\s*\[(?:cabang|branch|if)\]\s*)/i.exec(line);
  if (cabang) return cabang[1]!;
  const indent = /^(\s*)/.exec(line);
  return indent?.[1] ?? '';
}

/** Ambil token akhir baris: `->node` atau `-- label -->` (atau kosong). */
function extractEndToken(line: string): string {
  const labeled = /--\s*([^\n]+?)\s*-->\s*$/.exec(line);
  if (labeled) return `-- ${labeled[1]!.trim()} -->`;
  if (/->\s*node\s*$/i.test(line)) return '->node';
  return '';
}

/** Bangun ulang satu baris node dari NodeSpec + token akhir. */
function serializeNodeLine(node: NodeSpec, endToken: string): string {
  const parts: string[] = [];
  parts.push(`->[${node.shape}${node.color ? `:${node.color}` : ''}]`);
  if (node.icon) parts.push(`->icon["${sanitizeAttr(node.icon)}"]`);
  if (node.label) parts.push(`->text["${sanitizeLabel(node.label)}"]`);
  if (node.link) parts.push(`->link["${sanitizeAttr(node.link)}"]`);
  if (node.tooltip) parts.push(`->tooltip["${sanitizeAttr(node.tooltip)}"]`);
  if (endToken) parts.push(endToken);
  return parts.join('');
}

function sanitizeAttr(s: string): string {
  return s.replace(/"/g, "'").replace(/\n/g, ' ');
}

function sanitizeLabel(s: string): string {
  return s.replace(/"/g, "'").replace(/\n/g, '\\n');
}

// Ekspor `ShapeKind` agar tidak di-tree-shake bila perlu (opsional, aman dihapus)
export type { ShapeKind };