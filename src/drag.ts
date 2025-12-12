export function makeDraggable(dragBox: HTMLElement, dragHead: HTMLElement): void {
    let offsetX = 0;
    let offsetY = 0;

    let boxWidth = 0;
    let boxHeight = 0;

    let app = document.getElementById('app');
    let header = document.getElementById('header');
    let maxHeight =0;
    let maxWidth = 0;

    let newLeft = 0;
    let newTop = 0;

    let draggable = false;
    dragHead.addEventListener('mousedown', (e) => {
        const rect = dragBox.getBoundingClientRect();
        const headerRect = header?.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top + headerRect!.height  ;
        maxHeight = app!.clientHeight - headerRect!.height;
        maxWidth = app!.clientWidth;
        boxWidth = rect.width;
        boxHeight = rect.height;
        draggable = true;
        e.preventDefault();
    });

    document.addEventListener('mouseup', (e) => {
        draggable = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!draggable) return;
        let proposedLeft = e.clientX - offsetX;
        let proposedTop = e.clientY - offsetY;
        newLeft = Math.min(Math.max(proposedLeft, 0), maxWidth - boxWidth);
        newTop = Math.min(Math.max(proposedTop, 0), maxHeight  - boxHeight);
        requestAnimationFrame(() => {
            dragBox.style.transform = `translate(${newLeft}px,${newTop}px)`;
        });
    });
}