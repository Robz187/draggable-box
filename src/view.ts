import { fromEvent } from "rxjs";
import { makeDraggable } from "./drag";
import { createNewBox, deleteBox } from "./state";
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
    createBtn.innerText = '➕ Hinzufügen';
    createBtn.addEventListener('click', () =>  {
        const newBoxState = createNewBox();
        const newBox = createBox(newBoxState);
        document.getElementById('app')!.appendChild(newBox);
    });
    headerContainer.appendChild(headerTitle);
    headerContainer.appendChild(createBtn);
    document.getElementById('header')!.appendChild(headerContainer);
    document.getElementById('app')!.appendChild(startBox);
}

export function createBox(options : CreateBoxOptions): HTMLElement {
    const dragBox = document.createElement('div');
    dragBox.classList.add('dragBox');
    dragBox.style.height = '130px';
    dragBox.style.width = '200px';
    dragBox.style.zIndex = options.zIndex!.toString() || '0';

    const dragHead = document.createElement('div');
    dragHead.classList.add('header');
    dragHead.innerText = options.config?.header.title || 'Mach mich größer!';
    dragHead.dataset.id = options.id!.toString()

    const dragMain = document.createElement('div');
    dragMain.classList.add('content');
    dragMain.innerText = options.config?.content.text || 'Draggable Box';
    const delBtn = document.createElement('button');
    delBtn.classList.add('delete');
    delBtn.innerText = '🗑️';
    delBtn.addEventListener('click', () => {
       deleteBox(options.id!);
       dragBox.remove(); 
    })
    const positionText = document.createElement('p');
    positionText.classList.add('position-text');
    const spanX = document.createElement('span');
    spanX.classList.add('text-x');
    spanX.innerText = `X: ${options.position?.x}`;
    const spanY = document.createElement('span');
    spanY.classList.add('text-y');
    spanY.innerText = `Y: ${options.position?.y}`
    positionText.appendChild(spanX);
    positionText.appendChild(spanY);
    dragMain.appendChild(positionText);
    dragMain.appendChild(delBtn);
    dragBox.appendChild(dragHead);
    dragBox.appendChild(dragMain);
    makeDraggable(dragBox,dragHead);
    return dragBox;
}

