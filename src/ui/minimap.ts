import type { CompileResult } from '../core/types';

/* =========================================================
   MINIMAP — navigasi mini di sudut preview.
   - SVG ber-viewBox sama dengan diagram utama (auto-scale)
   - Rectangle viewport draggable
   - Klik luar rect → jump
   ========================================================= */

interface ViewBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export class Minimap {
    private readonly root: HTMLDivElement;
    private readonly svg: SVGSVGElement;
    private readonly bgRect: SVGRectElement;
    private readonly content: SVGGElement;
    private readonly viewportRect: SVGRectElement;

    private full: ViewBox | null = null;
    private currentViewport: ViewBox | null = null;

    private isDragging = false;
    private isAbsoluteDrag = false;
    private dragStartSvg = { x: 0, y: 0 };
    private dragStartView: ViewBox = { x: 0, y: 0, w: 0, h: 0 };

    /** Callback: minta preview untuk center di koordinat diagram (cx, cy). */
    onNavigate: ((cx: number, cy: number) => void) | null = null;

    constructor(container: HTMLElement) {
        this.root = document.createElement('div');
        this.root.className = 'minimap';
        this.root.hidden = true;
        this.root.setAttribute('aria-label', 'Navigasi minimap');

        this.svg = document.createElementNS(SVG_NS, 'svg');
        this.svg.setAttribute('class', 'minimap-svg');
        this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        this.svg.setAttribute('role', 'presentation');

        this.content = document.createElementNS(SVG_NS, 'g');
        this.content.setAttribute('class', 'minimap-content');

        this.bgRect = document.createElementNS(SVG_NS, 'rect');
        this.bgRect.setAttribute('class', 'minimap-bg');
        this.bgRect.setAttribute('fill', 'transparent');
        this.bgRect.setAttribute('pointer-events', 'all');

        this.viewportRect = document.createElementNS(SVG_NS, 'rect');
        this.viewportRect.setAttribute('class', 'minimap-viewport');
        this.viewportRect.setAttribute('pointer-events', 'all');

        this.svg.appendChild(this.content);
        this.svg.appendChild(this.bgRect);
        this.svg.appendChild(this.viewportRect);
        this.root.appendChild(this.svg);
        container.appendChild(this.root);

        this.bindEvents();
    }

    // --- Interaksi ---
    private bindEvents(): void {
        this.svg.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
        window.addEventListener('pointermove', (e) => this.handlePointerMove(e));
        window.addEventListener('pointerup', () => this.handlePointerUp());
        window.addEventListener('pointercancel', () => this.handlePointerUp());
    }

    private handlePointerDown(e: PointerEvent): void {
        if (!this.full || !this.currentViewport) return;
        const pt = this.toSvgCoords(e);
        if (!pt) return;

        const isOnViewport = (e.target as Element) === this.viewportRect;

        this.isDragging = true;
        this.isAbsoluteDrag = !isOnViewport;
        this.dragStartSvg = pt;
        this.dragStartView = { ...this.currentViewport };

        if (this.isAbsoluteDrag) {
            // Klik di background → center viewport di titik klik
            this.onNavigate?.(pt.x, pt.y);
        }

        try { this.svg.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        e.preventDefault();
        e.stopPropagation();
    }

    private handlePointerMove(e: PointerEvent): void {
        if (!this.isDragging || !this.full) return;
        const pt = this.toSvgCoords(e);
        if (!pt) return;

        if (this.isAbsoluteDrag) {
            this.onNavigate?.(pt.x, pt.y);
        } else {
            const dx = pt.x - this.dragStartSvg.x;
            const dy = pt.y - this.dragStartSvg.y;
            const cx = this.dragStartView.x + this.dragStartView.w / 2 + dx;
            const cy = this.dragStartView.y + this.dragStartView.h / 2 + dy;
            this.onNavigate?.(cx, cy);
        }
    }

    private handlePointerUp(): void {
        this.isDragging = false;
        this.isAbsoluteDrag = false;
    }

    /** Konversi koordinat pointer → koordinat diagram (memperhatikan letterboxing). */
    private toSvgCoords(e: PointerEvent): { x: number; y: number } | null {
        if (!this.full) return null;
        const rect = this.svg.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;

        const { x: fx, y: fy, w: fw, h: fh } = this.full;
        const svgAspect = rect.width / rect.height;
        const vbAspect = fw / fh;

        let contentW: number;
        let contentH: number;
        let offsetX = 0;
        let offsetY = 0;

        if (svgAspect > vbAspect) {
            // SVG lebih lebar → letterbox kiri/kanan
            contentH = rect.height;
            contentW = contentH * vbAspect;
            offsetX = (rect.width - contentW) / 2;
        } else {
            contentW = rect.width;
            contentH = contentW / vbAspect;
            offsetY = (rect.height - contentH) / 2;
        }

        const px = e.clientX - rect.left - offsetX;
        const py = e.clientY - rect.top - offsetY;
        if (px < 0 || py < 0 || px > contentW || py > contentH) return null;

        return {
            x: fx + (px / contentW) * fw,
            y: fy + (py / contentH) * fh,
        };
    }

    // --- Render API ---
    render(result: CompileResult): void {
        this.content.innerHTML = result.markup;

        const parts = result.viewBox.split(' ').map(Number);
        if (parts.length !== 4) return;
        const [x, y, w, h] = parts as [number, number, number, number];
        this.full = { x, y, w, h };

        this.svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);

        // Background rect menutupi seluruh viewBox agar mudah diklik
        this.bgRect.setAttribute('x', String(x));
        this.bgRect.setAttribute('y', String(y));
        this.bgRect.setAttribute('width', String(w));
        this.bgRect.setAttribute('height', String(h));
    }

    updateViewport(current: ViewBox, full: ViewBox | null): void {
        if (!full) {
            this.root.hidden = true;
            return;
        }

        this.currentViewport = current;

        // Sembunyikan jika viewport sudah fit ke seluruh diagram, atau diagram terlalu kecil
        const isFit =
            Math.abs(current.w - full.w) < 1 &&
            Math.abs(current.h - full.h) < 1 &&
            Math.abs(current.x - full.x) < 1 &&
            Math.abs(current.y - full.y) < 1;

        const tooSmall = full.w < 400 && full.h < 300;

        if (isFit || tooSmall) {
            this.root.hidden = true;
            return;
        }

        this.root.hidden = false;

        // Clip rect viewport ke area diagram (bisa keluar saat pan ekstrem)
        const rx = Math.max(full.x, current.x);
        const ry = Math.max(full.y, current.y);
        const rx2 = Math.min(full.x + full.w, current.x + current.w);
        const ry2 = Math.min(full.y + full.h, current.y + current.h);
        const rw = Math.max(1, rx2 - rx);
        const rh = Math.max(1, ry2 - ry);

        this.viewportRect.setAttribute('x', String(rx));
        this.viewportRect.setAttribute('y', String(ry));
        this.viewportRect.setAttribute('width', String(rw));
        this.viewportRect.setAttribute('height', String(rh));
    }
}