import { fromEvent, switchMap, map, takeUntil, buffer, debounceTime, filter } from "rxjs";
import { bringBoxToFront } from "./state";

export function makeDraggable(dragBox: HTMLElement, dragHead: HTMLElement): void {

    let app = document.getElementById('app');
    let header = document.getElementById('header');
    const mouseDown$ = fromEvent<MouseEvent>(dragHead, 'mousedown');
    const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');
    const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
    const doubleClick$ = mouseDown$.pipe(
        buffer(mouseDown$.pipe(debounceTime(250))),
        map(mouseDown => mouseDown.length),
        filter(mouseDownLength => mouseDownLength >= 2)
    );

    mouseDown$
        .pipe(
            switchMap(downEvent => {
                const element = downEvent.currentTarget as HTMLElement;
                const id = Number(element.dataset.id);
                const newZIndex = bringBoxToFront(id);
                setNewZIndex(newZIndex);
                setColor('rgb(51, 65, 185)');
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

                    }), takeUntil(mouseUp$),
                )
            })
        ).subscribe(position => {
            dragTransform(position.newLeft, position.newTop);
            displayPosition(position.newLeft,position.newTop);
        })

    mouseUp$.subscribe(() => setColor('#2a2a2a'));
    doubleClick$.subscribe(()=> {
        const rect = dragBox.getBoundingClientRect();
        requestAnimationFrame(()=> {
            dragBox.style.height = `${rect.height * 1.3}px`;
            dragBox.style.width = `${rect.width * 1.3}px`;
        })
    })
    function dragTransform(newLeft: number, newTop: number): void {
        requestAnimationFrame(() => {
            dragBox.style.transform = `translate(${newLeft}px,${newTop}px)`;
        });
    }
    function setNewZIndex(zIndex: number) {
        requestAnimationFrame(() => {
            dragBox.style.zIndex = zIndex.toString();
        })
    }
    function setColor(color: string) {
        requestAnimationFrame(() => {
            dragBox.style.background = color;
        });
    }
    function displayPosition(newX: number , newY : number){
        requestAnimationFrame(()=> {
        const currentX = dragBox.getElementsByClassName('text-x');
        const currentY = dragBox.getElementsByClassName('text-y');
        currentX[0].innerHTML = `X: ${newX.toString()}`;
        currentY[0].innerHTML = `Y: ${newY.toString()}`;
        });
    }
}