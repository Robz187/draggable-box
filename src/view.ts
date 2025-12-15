import { makeDraggable } from "./drag";
import { createNewBox } from "./state";
import { CreateBoxOptions } from "./types";


export function createApp() {
    const firstBox = createNewBox();
    const startBox = createBox(firstBox);
    const headerContainer = document.createElement('div');
    headerContainer.classList.add('header-container');
    const headerTitle = document.createElement('h1');
    headerTitle.classList.add('title');
    headerTitle.innerText = 'Drag & Drop Aufgabe';
    const createBtn = document.createElement('button');
    createBtn.classList.add('btn');
    createBtn.innerText = 'Box Hinzufügen';
    createBtn.addEventListener('click', () =>  {
        const newBoxState = createNewBox();
        const newBox = createBox(newBoxState);
        document.getElementById('app')!.appendChild(newBox);
    });
    headerContainer.appendChild(headerTitle);
    headerContainer.appendChild(createBtn);
    headerContainer.appendChild(document.createElement('hr'));
    document.getElementById('header')!.appendChild(headerContainer);
    document.getElementById('app')!.appendChild(startBox);
}

export function createBox(options : CreateBoxOptions): HTMLElement {
    const dragBox = document.createElement('div');
    dragBox.classList.add('dragBox');
    dragBox.style.height = '200px';
    dragBox.style.width = '150px';
    dragBox.style.zIndex = options.zIndex?.toString() || '0';
    dragBox.dataset.id = options.id!.toString()

    const dragHead = document.createElement('div');
    dragHead.classList.add('header');
    dragHead.innerText = options.config?.header.title || 'Mach mich größer!';

    const dragMain = document.createElement('div');
    dragMain.classList.add('content');
    dragMain.innerText = options.config?.content.text || 'Draggable Box';

    dragBox.appendChild(dragHead);
    dragBox.appendChild(dragMain);
    makeDraggable(dragBox,dragHead);
    return dragBox;
}

