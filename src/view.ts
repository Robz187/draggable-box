import { CreateBoxOptions } from "./types";


export function createApp(options : CreateBoxOptions) {
    const startBox = createBox(options);
    const headerContainer = document.createElement('div');
    headerContainer.classList.add('header-container');
    const headerTitle = document.createElement('h1');
    headerTitle.classList.add('title');
    headerTitle.innerText = 'Drag & Drop Aufgabe';
    const createBtn = document.createElement('button');
    createBtn.classList.add('btn');
    createBtn.innerText = 'Box Hinzufügen';
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

    const dragHead = document.createElement('div');
    dragHead.classList.add('header');
    dragHead.innerText = options.config?.header.title || 'Mach mich größer!';

    const dragMain = document.createElement('div');
    dragMain.classList.add('content');
    dragMain.innerText = options.config?.content.text || 'Draggable Box';

    dragBox.appendChild(dragHead);
    dragBox.appendChild(dragMain);
    return dragBox;
}

