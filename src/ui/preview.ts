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

  constructor(
    private readonly canvas: SVGSVGElement,
    private readonly errorBox: HTMLElement,
  ) {
    this.setupInteractions();
  }

  // Getter baru untuk mengambil elemen SVG
  get svgElement(): SVGSVGElement {
    return this.canvas;
  }

  render(result: CompileResult): void {
    this.canvas.innerHTML = result.markup;
    
    const parts = result.viewBox.split(' ').map(Number);
    if (parts.length === 4) {
      this.vbX = parts[0]!;
      this.vbY = parts[1]!;
      this.vbW = parts[2]!;
      this.vbH = parts[3]!;
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

  /** Terapkan nilai viewBox ke SVG. */
  private applyViewBox(): void {
    this.canvas.setAttribute('viewBox', `${this.vbX} ${this.vbY} ${this.vbW} ${this.vbH}`);
  }

  /** Daftarkan event listener untuk pan dan zoom. */
  private setupInteractions(): void {
    // --- 1. Geser (Pan) ---
    this.canvas.addEventListener('mousedown', (e) => {
      // Hanya geser jika klik kiri (button 0)
      if (e.button !== 0) return;
      this.isDragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });

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
}