import { compile } from '../core/compile';
import type { TextMeasurer, EdgeStyle } from '../core/types';
import { createCanvasMeasurer } from './canvas-measurer';
import { Editor } from './editor';
import { Preview } from './preview';
import { createIcons, icons } from 'lucide';

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

  constructor(
    private readonly editor: Editor,
    private readonly preview: Preview,
    downloadSvgBtn: HTMLButtonElement,
    downloadPngBtn: HTMLButtonElement, // <-- Parameter baru
    toggleEditorBtn: HTMLButtonElement,
    styleSelect: HTMLSelectElement,
  ) {
    this.measurer = createCanvasMeasurer();
    this.editor.onInput(() => this.scheduleRender());
    
    // Event Listener Download SVG
    downloadSvgBtn.addEventListener('click', () => this.downloadSvg());
    
    // Event Listener Download PNG
    downloadPngBtn.addEventListener('click', () => this.downloadPng());

    styleSelect.addEventListener('change', (e) => {
      this.edgeStyle = (e.target as HTMLSelectElement).value as EdgeStyle;
      this.scheduleRender();
    });

    toggleEditorBtn.addEventListener('click', () => {
      const appEl = document.querySelector('.app');
      if (!appEl) return;
      const isHidden = appEl.classList.toggle('hide-editor');
      
      toggleEditorBtn.innerHTML = isHidden 
        ? `<i data-lucide="eye"></i> <span id="toggle-text">Tampilkan Kode</span>`
        : `<i data-lucide="eye-off"></i> <span id="toggle-text">Sembunyikan Kode</span>`;
      
      createIcons({ icons });
      setTimeout(() => this.scheduleRender(), 350); 
    });
  }

  start(initialSource: string): void {
    this.editor.value = initialSource;
    this.renderNow();
  }

  private scheduleRender(): void {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.renderNow();
    });
  }

  private renderNow(): void {
    this.preview.render(compile(this.editor.value, { 
      measure: this.measurer ?? undefined,
      edgeStyle: this.edgeStyle,
      getIcon: getLucideIcon 
    }));
  }

  // --- LOGIKA DOWNLOAD SVG ---
  private downloadSvg(): void {
    const svgString = this.preview.svgElement.outerHTML;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- LOGIKA DOWNLOAD PNG ---
  private downloadPng(): void {
    const svgElement = this.preview.svgElement;
    let svgString = svgElement.outerHTML;
    
    // Pastikan ada atribut xmlns agar Image() bisa me-load SVG string dengan benar
    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgString = svgString.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    }

    const viewBoxStr = svgElement.getAttribute('viewBox') || '0 0 800 600';
    const [, , vbW, vbH] = viewBoxStr.split(' ').map(Number);

    if (!vbW || !vbH) return;

    // Skala 2x lipat agar hasil PNG tidak pecah (High-Res)
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = vbW * scale;
    canvas.height = vbH * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Isi latar belakang dengan warna gelap (sesuai tema) agar tidak transparan
    ctx.fillStyle = '#0d1117'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Gambar SVG ke dalam Canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      // Konversi Canvas ke Data URL PNG dan unduh
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = 'diagram.png';
      a.click();
    };

    img.onerror = (e) => {
      console.error('Gagal memproses PNG', e);
      URL.revokeObjectURL(url);
      alert('Gagal mengunduh PNG. Pastikan browser mendukung konversi Canvas.');
    };

    img.src = url;
  }
}