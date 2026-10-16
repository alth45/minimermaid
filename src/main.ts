/* =========================================================
   BOOTSTRAP — titik masuk aplikasi.
   ========================================================= */

import './styles/main.css';
import { DEFAULT_SOURCE } from './core/config';
import { App } from './ui/app';
import { Editor } from './ui/editor';
import { Preview } from './ui/preview';
import { qs } from './ui/dom';

const app = new App(
  new Editor(qs<HTMLTextAreaElement>('#src')),
  new Preview(qs<SVGSVGElement>('#canvas'), qs('#errors')),
  qs<HTMLButtonElement>('#download'),
);

app.start(DEFAULT_SOURCE);
