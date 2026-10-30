import type { CompileResult } from '../core/types';

/* =========================================================
   PREVIEW — menampilkan markup SVG + daftar error di kanvas.
   Dilengkapi fitur Pan (geser) dan Zoom (scroll).
   ========================================================= */



export class Preview {
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;

  private vbX = 0;
  private vbY = 0;
  private vbW = 100;
  private vbH = 100;

  /** ViewBox awal (fit-to-content), untuk reset. */
  private savedVB: { x: number; y: number; w: number; h: number } | null = null;
  onViewChange: (() => void) | null = null;

  constructor(
    private readonly canvas: SVGSVGElement,
    private readonly errorBox: HTMLElement,
  ) {
    this.setupInteractions();
  }

  get svgElement(): SVGSVGElement { return this.canvas; }

  render(result: CompileResult): void {
    this.canvas.innerHTML = result.markup;

    const parts = result.viewBox.split(' ').map(Number);
    if (parts.length === 4) {
      this.vbX = parts[0]!;
      this.vbY = parts[1]!;
      this.vbW = parts[2]!;
      this.vbH = parts[3]!;
      this.savedVB = { x: this.vbX, y: this.vbY, w: this.vbW, h: this.vbH };
      this.applyViewBox();
    }

    this.errorBox.replaceChildren(
      ...result.errors.map((message) => {
        const div = document.createElement('div');
        div.textContent = `⚠ ${message}`;
        return div;
      }),
    );
  }

  // --- BARU: Kontrol Zoom ---
  zoomIn(): void { this.zoomBy(0.85); }
  zoomOut(): void { this.zoomBy(1.15); }

  resetView(): void {
    if (!this.savedVB) return;
    this.vbX = this.savedVB.x;
    this.vbY = this.savedVB.y;
    this.vbW = this.savedVB.w;
    this.vbH = this.savedVB.h;
    this.applyViewBox();
  }

  private zoomBy(factor: number): void {
    const newW = this.vbW * factor;
    if (newW < 10 || newW > 10000) return;
    const cx = this.vbX + this.vbW / 2;
    const cy = this.vbY + this.vbH / 2;
    this.vbW = newW;
    this.vbH = this.vbH * factor;
    this.vbX = cx - this.vbW / 2;
    this.vbY = cy - this.vbH / 2;
    this.applyViewBox();
  }

  private applyViewBox(): void {
    this.canvas.setAttribute('viewBox', `${this.vbX} ${this.vbY} ${this.vbW} ${this.vbH}`);
    this.onViewChange?.();
  }

  onNodeClick: ((idx: number | null) => void) | null = null;
  private mouseDownX = 0;
  private mouseDownY = 0;
  /** Daftarkan event listener untuk pan dan zoom. */
  private setupInteractions(): void {
    // --- 1. Geser (Pan) ---
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.mouseDownX = e.clientX;   // ← TAMBAH
      this.mouseDownY = e.clientY;   // ← TAMBAH
    });

    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));



    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;

      // Konversi pergerakan pixel layar ke satuan koordinat SVG
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.vbW / rect.width;
      const scaleY = this.vbH / rect.height;

      // Kurangi vbX untuk menggeser sebaliknya (karena pergerakan mouse berlawanan dengan pergerakan kamera)
      this.vbX -= dx * scaleX;
      this.vbY -= dy * scaleY;

      this.applyViewBox();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // --- 2. Zoom in/out (Scroll) ---
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault(); // Cegah halaman ikut ter-scroll

      // Faktor zoom (0.9 untuk memperkecil, 1.1 untuk memperbesar)
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;

      // Batas zoom (minimal 10%, maksimal 1000%)
      const newW = this.vbW * zoomFactor;
      if (newW < 10 || newW > 10000) return;

      // Dapatkan posisi mouse relatif terhadap elemen SVG
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Hitung koordinat mouse di dalam ruang SVG saat ini
      const svgMouseX = this.vbX + mouseX * (this.vbW / rect.width);
      const svgMouseY = this.vbY + mouseY * (this.vbH / rect.height);

      // Hitung dimensi baru
      this.vbW = newW;
      this.vbH = this.vbH * zoomFactor;

      // Geser titik asal (x,y) agar zoom berpusat tepat di posisi kursor mouse
      this.vbX = svgMouseX - mouseX * (this.vbW / rect.width);
      this.vbY = svgMouseY - mouseY * (this.vbH / rect.height);

      this.applyViewBox();
    }, { passive: false });
  }

  private handleCanvasClick(e: MouseEvent): void {
    const dx = Math.abs(e.clientX - this.mouseDownX);
    const dy = Math.abs(e.clientY - this.mouseDownY);
    if (Math.hypot(dx, dy) > 5) return;          // abaikan klik hasil drag

    const target = e.target as Element;
    const group = target.closest('g.node');
    if (!group) { this.onNodeClick?.(null); return; }
    if (group.closest('a')) return;               // node ber-link → biarkan default

    const idxStr = group.getAttribute('data-node-idx');
    if (idxStr !== null) this.onNodeClick?.(parseInt(idxStr, 10));
  }

  highlightNode(idx: number | null): void {
    this.canvas.querySelectorAll('g.node.selected')
      .forEach((el) => el.classList.remove('selected'));
    if (idx === null) return;
    const el = this.canvas.querySelector(`g.node[data-node-idx="${idx}"]`);
    el?.classList.add('selected');
  }

  /** Snapshot state viewport saat ini + bounds penuh (fit-to-content). */
  getViewState(): {
    current: { x: number; y: number; w: number; h: number };
    full: { x: number; y: number; w: number; h: number } | null;
  } {
    return {
      current: { x: this.vbX, y: this.vbY, w: this.vbW, h: this.vbH },
      full: this.savedVB ? { ...this.savedVB } : null,
    };
  }

  /** Navigasi programatik: pusatkan viewport di koordinat (cx, cy). */
  centerOn(cx: number, cy: number): void {
    this.vbX = cx - this.vbW / 2;
    this.vbY = cy - this.vbH / 2;
    this.applyViewBox();
  }
}