import './styles/main.css';
import { DEFAULT_SOURCE } from './core/config';
import { App } from './ui/app';
import { Editor } from './ui/editor';
import { Preview } from './ui/preview';
import { qs } from './ui/dom';
import { createIcons, icons } from 'lucide'; // Import Lucide


const editor = new Editor(qs<HTMLTextAreaElement>('#src'));
const app = new App(
  editor,
  new Preview(qs<SVGSVGElement>('#canvas'), qs('#errors')),
  qs<HTMLButtonElement>('#download'),
  qs<HTMLButtonElement>('#download-png'), // <-- Oper tombol PNG
  qs<HTMLButtonElement>('#toggle-editor'),
  qs<HTMLSelectElement>('#edge-style'), // Oper select
);

app.start(DEFAULT_SOURCE);
createIcons({ icons });

// --- Logika Modal Dokumentasi ---
const docBtn = qs<HTMLButtonElement>('#doc-btn');
const docModal = qs<HTMLDivElement>('#doc-modal');
const closeDocBtn = qs<HTMLButtonElement>('#close-doc');

const toggleModal = (open: boolean) => {
  if (open) {
    docModal.classList.add('open');
  } else {
    docModal.classList.remove('open');
  }
};

docBtn.addEventListener('click', () => toggleModal(true));
closeDocBtn.addEventListener('click', () => toggleModal(false));

// Tutup modal jika klik di luar area konten (overlay)
docModal.addEventListener('click', (e) => {
  if (e.target === docModal) toggleModal(false);
});

// Tangkap semua tombol "Coba Kode Ini" di dalam modal
docModal.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('try-btn')) {
    const code = target.getAttribute('data-code');
    if (code) {
      // Masukkan kode ke editor
      editor.value = code;
      
      // Tutup modal
      toggleModal(false);
      
      // Picu event input palsu agar App melakukan render ulang diagram
      const inputEvent = new Event('input', { bubbles: true });
      qs<HTMLTextAreaElement>('#src').dispatchEvent(inputEvent);
    }
  }
});