/* =========================================================
   SHORTCUT MANAGER — registry pintasan keyboard.
   + Renderer modal cheat-sheet.
   ========================================================= */

import { escapeXml } from '../rendering/svg-utils';

export interface Shortcut {
  /** Kunci utama, mis. 's', 'Enter', 'Escape', '/', '='. */
  readonly key: string;
  /** Alias opsional, mis. '+' untuk '='. */
  readonly aliases?: readonly string[];
  readonly ctrl?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
  readonly label: string;
  readonly group: string;
  /**
   * Handler. Kembalikan `false` untuk menandakan tidak ditangani,
   * sehingga event tidak di-preventDefault (berguna untuk Escape).
   */
  readonly handler: () => void | boolean;
}

export class ShortcutManager {
  private readonly shortcuts: Shortcut[] = [];
  private readonly boundHandler: (e: KeyboardEvent) => void;
  private attached = false;

  constructor() {
    this.boundHandler = (e) => this.handle(e);
  }

  register(s: Shortcut): void {
    this.shortcuts.push(s);
  }

  registerAll(list: readonly Shortcut[]): void {
    for (const s of list) this.register(s);
  }

  attach(): void {
    if (this.attached) return;
    window.addEventListener('keydown', this.boundHandler);
    this.attached = true;
  }

  detach(): void {
    if (!this.attached) return;
    window.removeEventListener('keydown', this.boundHandler);
    this.attached = false;
  }

  getAll(): readonly Shortcut[] { return this.shortcuts; }

  private handle(e: KeyboardEvent): void {
    const pressedRaw = e.key;
    const pressedNorm = pressedRaw.length === 1 ? pressedRaw.toLowerCase() : pressedRaw;
    const hasCtrl = e.ctrlKey || e.metaKey;

    for (const s of this.shortcuts) {
      const candidates = [s.key, ...(s.aliases ?? [])].map((k) =>
        k.length === 1 ? k.toLowerCase() : k,
      );
      if (!candidates.includes(pressedNorm)) continue;

      if (!!s.ctrl !== hasCtrl) continue;
      if (!!s.shift !== e.shiftKey) continue;
      if (!!s.alt !== e.altKey) continue;

      const result = s.handler();
      if (result !== false) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }
  }
}

/* =========================================================
   MODAL CHEAT-SHEET RENDERER
   ========================================================= */

const isMac = (): boolean =>
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

const DISPLAY_MAP: Record<string, string> = {
  Escape: 'Esc',
  Enter: 'Enter',
  ' ': 'Space',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
};

function displayKey(key: string): string {
  return DISPLAY_MAP[key] ?? (key.length === 1 ? key.toUpperCase() : key);
}

function keyChips(s: Shortcut, modLabel: string): string {
  const chips: string[] = [];
  if (s.ctrl) chips.push(`<kbd>${modLabel}</kbd>`);
  if (s.alt) chips.push('<kbd>Alt</kbd>');
  if (s.shift) chips.push('<kbd>Shift</kbd>');
  chips.push(`<kbd>${escapeXml(displayKey(s.key))}</kbd>`);
  return chips.join('<span class="sep">+</span>');
}

/** Bangun HTML isi modal bantuan dari daftar shortcut. */
export function buildShortcutsHelpHTML(shortcuts: readonly Shortcut[]): string {
  const modLabel = isMac() ? '⌘' : 'Ctrl';

  const groups = new Map<string, Shortcut[]>();
  for (const s of shortcuts) {
    if (!groups.has(s.group)) groups.set(s.group, []);
    groups.get(s.group)!.push(s);
  }

  let html = '';
  for (const [group, list] of groups.entries()) {
    html += `<div class="shortcut-group"><h4>${escapeXml(group)}</h4><dl>`;
    for (const s of list) {
      html += `<dt>${escapeXml(s.label)}</dt><dd>${keyChips(s, modLabel)}</dd>`;
    }
    html += `</dl></div>`;
  }
  return html;
}