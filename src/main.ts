import './styles/main.css';
import { DEFAULT_SOURCE } from './core/config';
import { App } from './ui/app';
import { Editor } from './ui/editor';
import { Preview } from './ui/preview';
import { qs } from './ui/dom';
import { createIcons, icons } from 'lucide';
import { decodeSource, STORAGE_KEYS } from './ui/url-state';
import { ShortcutManager, buildShortcutsHelpHTML } from './ui/shortcuts';
import type { ThemeName } from './core/types';

const editor = new Editor(qs<HTMLTextAreaElement>('#src'));
const preview = new Preview(qs<SVGSVGElement>('#canvas'), qs('#errors'));

const app = new App(
  editor,
  preview,
  qs<HTMLButtonElement>('#download'),
  qs<HTMLButtonElement>('#download-png'),
  qs<HTMLButtonElement>('#toggle-editor'),
  qs<HTMLSelectElement>('#edge-style'),
  qs<HTMLButtonElement>('#share-btn'),
  qs<HTMLButtonElement>('#copy-svg-btn'),
  qs<HTMLButtonElement>('#zoom-in'),
  qs<HTMLButtonElement>('#zoom-out'),
  qs<HTMLButtonElement>('#zoom-reset'),
  qs<HTMLButtonElement>('#theme-btn'),
  qs<HTMLButtonElement>('#import-json-btn'),
  qs<HTMLButtonElement>('#export-json-btn'),
);

function loadInitialSource(): string {
  if (location.hash.startsWith('#d=')) {
    try { return decodeSource(location.hash.slice(3)); } catch { /* fallthrough */ }
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.source);
    if (saved) return saved;
  } catch { /* ignore */ }
  return DEFAULT_SOURCE;
}

function loadInitialTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* ignore */ }
  return 'dark';
}

try {
  const savedStyle = localStorage.getItem(STORAGE_KEYS.edgeStyle);
  if (savedStyle) {
    const sel = qs<HTMLSelectElement>('#edge-style');
    sel.value = savedStyle;
    sel.dispatchEvent(new Event('change'));
  }
} catch { /* ignore */ }

app.start(loadInitialSource(), loadInitialTheme());
createIcons({ icons });

/* =========================================================
   MODAL WIRING (Dokumentasi + Pintasan)
   ========================================================= */
const docModal = qs<HTMLDivElement>('#doc-modal');
const shortcutsModal = qs<HTMLDivElement>('#shortcuts-modal');

function closeAllModals(): boolean {
  const openModals = document.querySelectorAll<HTMLElement>('.modal-overlay.open');
  if (openModals.length === 0) return false;
  openModals.forEach((m) => m.classList.remove('open'));
  return true;
}

function toggleModal(modal: HTMLElement, open: boolean): void {
  modal.classList.toggle('open', open);
}

function openShortcutsModal(): void {
  const body = document.getElementById('shortcuts-body');
  if (body) {
    body.innerHTML = buildShortcutsHelpHTML(shortcuts.getAll());
  }
  shortcutsModal.classList.add('open');
}

function toggleShortcutsModal(): void {
  if (shortcutsModal.classList.contains('open')) {
    shortcutsModal.classList.remove('open');
  } else {
    openShortcutsModal();
  }
}

// Tombol Dokumentasi
const docBtn = qs<HTMLButtonElement>('#doc-btn');
const closeDocBtn = qs<HTMLButtonElement>('#close-doc');
docBtn.addEventListener('click', () => toggleModal(docModal, true));
closeDocBtn.addEventListener('click', () => toggleModal(docModal, false));
docModal.addEventListener('click', (e) => { if (e.target === docModal) toggleModal(docModal, false); });

// Tombol Pintasan
const helpBtn = qs<HTMLButtonElement>('#help-btn');
const closeShortcutsBtn = qs<HTMLButtonElement>('#close-shortcuts');
helpBtn.addEventListener('click', openShortcutsModal);
closeShortcutsBtn.addEventListener('click', () => toggleModal(shortcutsModal, false));
shortcutsModal.addEventListener('click', (e) => { if (e.target === shortcutsModal) toggleModal(shortcutsModal, false); });

// Tombol "Coba Kode Ini" di modal docs
docModal.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('try-btn')) {
    const code = target.getAttribute('data-code');
    if (code) {
      editor.value = code;
      toggleModal(docModal, false);
      qs<HTMLTextAreaElement>('#src').dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
});

/* =========================================================
   SHORTCUTS
   ========================================================= */
const shortcuts = new ShortcutManager();

shortcuts.registerAll([
  // Umum
  {
    key: 'Enter', ctrl: true, label: 'Render ulang diagram', group: 'Umum',
    handler: () => app.forceRender()
  },

  // File
  {
    key: 's', ctrl: true, label: 'Bagikan URL (salin ke clipboard)', group: 'File',
    handler: () => { void app.share(); }
  },
  {
    key: 'o', ctrl: true, label: 'Impor dokumen .mmd.json', group: 'File',
    handler: () => { void app.handleImportJson(); }
  },
  {
    key: 'e', ctrl: true, label: 'Ekspor dokumen .mmd.json', group: 'File',
    handler: () => app.handleExportJson()
  },
  {
    key: 's', ctrl: true, shift: true, label: 'Unduh SVG', group: 'File',
    handler: () => app.downloadSvg()
  },
  {
    key: 'p', ctrl: true, shift: true, label: 'Unduh PNG', group: 'File',
    handler: () => app.downloadPng()
  },

  // Tampilan
  {
    key: 'b', ctrl: true, label: 'Sembunyikan / tampilkan editor', group: 'Tampilan',
    handler: () => app.toggleEditorUI()
  },
  {
    key: 'l', ctrl: true, shift: true, label: 'Ganti tema (terang / gelap)', group: 'Tampilan',
    handler: () => app.toggleThemeUI()
  },
  {
    key: '=', aliases: ['+'], ctrl: true, label: 'Perbesar (zoom in)', group: 'Tampilan',
    handler: () => app.zoomIn()
  },
  {
    key: '-', ctrl: true, label: 'Perkecil (zoom out)', group: 'Tampilan',
    handler: () => app.zoomOut()
  },
  {
    key: '0', ctrl: true, label: 'Reset zoom (fit)', group: 'Tampilan',
    handler: () => app.resetZoom()
  },

  // Bantuan
  {
    key: '/', ctrl: true, label: 'Tampilkan / sembunyikan pintasan', group: 'Bantuan',
    handler: () => { toggleShortcutsModal(); }
  },
  {
    key: 'Escape', label: 'Tutup modal', group: 'Bantuan',
    handler: () => closeAllModals()
  }, // return false otomatis bila tidak ada modal terbuka
]);

shortcuts.attach();