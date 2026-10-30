import type { NodeSpec, ShapeKind } from '../core/types';
import { ALL_SHAPES } from '../core/config';

/* =========================================================
   PROPERTY PANEL — editor properti node (form floating).
   ========================================================= */

export class PropertyPanel {
  private readonly root: HTMLDivElement;
  private current: NodeSpec | null = null;

  onApply: ((node: NodeSpec) => void) | null = null;
  onClose: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'property-panel';
    this.root.hidden = true;
    this.root.innerHTML = this.template();
    container.appendChild(this.root);
    this.bindEvents();
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  private template(): string {
    const shapes = ALL_SHAPES
      .map((s) => `<option value="${s}">${s}</option>`)
      .join('');

    return `
      <div class="pp-header">
        <span class="pp-title">Properti Node</span>
        <button class="pp-close" type="button" aria-label="Tutup">×</button>
      </div>
      <div class="pp-body">
        <label class="pp-field">
          <span>Bentuk</span>
          <select data-field="shape">${shapes}</select>
        </label>
        <label class="pp-field">
          <span>Warna</span>
          <input type="text" data-field="color" placeholder="#58a6ff / red / kosong">
        </label>
        <label class="pp-field">
          <span>Ikon Lucide</span>
          <input type="text" data-field="icon" placeholder="user, settings, check">
        </label>
        <label class="pp-field">
          <span>Label</span>
          <textarea data-field="label" rows="2" placeholder="Teks node"></textarea>
        </label>
        <label class="pp-field">
          <span>Link</span>
          <input type="url" data-field="link" placeholder="https://...">
        </label>
        <label class="pp-field">
          <span>Tooltip</span>
          <input type="text" data-field="tooltip" placeholder="Teks saat hover">
        </label>
      </div>
      <div class="pp-footer">
        <button class="pp-cancel" type="button">Batal</button>
        <button class="pp-apply" type="button">Terapkan</button>
      </div>
    `;
  }

  private bindEvents(): void {
    this.root.querySelector('.pp-close')?.addEventListener('click', () => this.close());
    this.root.querySelector('.pp-cancel')?.addEventListener('click', () => this.close());
    this.root.querySelector('.pp-apply')?.addEventListener('click', () => this.apply());

    this.root.addEventListener('keydown', (e) => {
      const inTextarea = (e.target as Element).matches('textarea');
      if (e.key === 'Enter' && !inTextarea) {
        e.preventDefault();
        this.apply();
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        this.close();
      }
    });
  }

  open(node: NodeSpec): void {
    this.current = node;
    this.root.hidden = false;

    const set = (field: string, value: string) => {
      const el = this.root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `[data-field="${field}"]`,
      );
      if (el) el.value = value;
    };

    set('shape', node.shape);
    set('color', node.color ?? '');
    set('icon', node.icon ?? '');
    set('label', node.label);
    set('link', node.link ?? '');
    set('tooltip', node.tooltip ?? '');
  }

  close(): void {
    if (this.root.hidden) return;
    this.current = null;
    this.root.hidden = true;
    this.onClose?.();
  }

  private apply(): void {
    if (!this.current) return;

    const get = (field: string): string => {
      const el = this.root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `[data-field="${field}"]`,
      );
      return el?.value ?? '';
    };

    const updated: NodeSpec = {
      ...this.current,
      shape: get('shape') as ShapeKind,
      color: get('color').trim() || undefined,
      icon: get('icon').trim() || undefined,
      label: get('label'),
      link: get('link').trim() || undefined,
      tooltip: get('tooltip').trim() || undefined,
    };
    this.onApply?.(updated);
  }
}