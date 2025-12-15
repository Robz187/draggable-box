import { fromEvent, switchMap, map, takeUntil } from "rxjs";
import { bringBoxToFront } from "./state";

export function makeDraggable(dragBox: HTMLElement, dragHead: HTMLElement): void {

    let app = document.getElementById('app');
    let header = document.getElementById('header');
    const mouseDown$ = fromEvent<MouseEvent>(dragHead, 'mousedown');
    const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');
    const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');

    mouseDown$.pipe(
        switchMap(downEvent => {
            const element = downEvent.currentTarget as HTMLElement;
            const id = Number(element.dataset.id);
            const newZIndex = bringBoxToFront(id);
            setNewZIndex(newZIndex);
            const rect = dragBox.getBoundingClientRect();
            const headerRect = header?.getBoundingClientRect();

            const offsetX = downEvent.clientX - rect.left;
            const offsetY = downEvent.clientY - rect.top + headerRect!.height;
            const maxHeight = app!.clientHeight - headerRect!.height;
            const maxWidth = app!.clientWidth;
            const boxWidth = rect.width;
            const boxHeight = rect.height;
            downEvent.preventDefault();
            return mouseMove$.pipe(
                map(moveEvent => {
                    const proposedLeft = moveEvent.clientX - offsetX;
                    const proposedTop = moveEvent.clientY - offsetY;

                    const newLeft = Math.min(Math.max(proposedLeft, 0), maxWidth - boxWidth);
                    const newTop = Math.min(Math.max(proposedTop, 0), maxHeight - boxHeight);
                    return { newLeft, newTop }

                }), takeUntil(mouseUp$)
            )
        })
    ).subscribe(position => {
        dragTransform(position.newLeft, position.newTop);
    })

    function dragTransform(newLeft: number, newTop: number): void {
        requestAnimationFrame(() => {
            dragBox.style.transform = `translate(${newLeft}px,${newTop}px)`;
        });
    }
    function setNewZIndex(zIndex : number){
        requestAnimationFrame(()=> {
            dragBox.style.zIndex = zIndex.toString();
        })
    }
}