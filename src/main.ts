import { makeDraggable } from './drag';
import './style.css'
import { createApp } from './view';

// Box Komponente erstellen
createApp({
  config: {
    header: { title: 'Meine Box', color: 'blue' },
    start: { x: 100, y: 100 },
    size: { width: 200, height: 150 },
    content: { text: 'Hallo Welt!', color: 'black' }
  }
});
const dragBox = document.querySelector<HTMLElement>('.dragBox')!;
const dragHead = document.querySelector<HTMLElement>('.header')!;
makeDraggable(dragBox, dragHead);
