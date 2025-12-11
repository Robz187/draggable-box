// Box erstellen mit den vorgegebenen eigenschaften TAG 1
const dragBox = document.createElement('div');
dragBox.classList.add('dragBox');
dragBox.style.height = '200px';
dragBox.style.width = '150px';

const dragHead = document.createElement('div');
dragHead.classList.add('header');
dragHead.innerText = 'Mach mich größer!';

const dragMain = document.createElement('div');
dragMain.classList.add('content');
dragMain.innerText = 'Draggable Box';

dragBox.appendChild(dragHead);
dragBox.appendChild(dragMain);

document.getElementById('app')!.appendChild(dragBox);
//

//Tag 2 Console.log die verschiedenen Mouse Events
/*
dragHead.addEventListener('click', (e) => {
  let clientX = e.clientX;
  let clientY = e.clientY;
  let pageX = e.pageX;
  let pageY = e.pageY;
  console.log('------------');
  console.log('Click');
  console.log(`ClientX:${clientX} ClientY:${clientY}`);
  console.log(`PageX:${pageX} PageY:${pageY}`);
  console.log('------------');
});
dragBox.addEventListener('mouseenter', (e) => {
  let clientX = e.clientX;
  let clientY = e.clientY;
  let pageX = e.pageX;
  let pageY = e.pageY;

  console.log(`ClientX:${clientX} ClientY:${clientY}`);
  console.log(`PageX:${pageX} PageY:${pageY}`);
});
dragBox.addEventListener('mouseup', (e) => {
  let clientX = e.clientX;
  let clientY = e.clientY;
  let pageX = e.pageX;
  let pageY = e.pageY;
  console.log('------------');
  console.log('MouseUp');
  console.log(`ClientX:${clientX} ClientY:${clientY}`);
  console.log(`PageX:${pageX} PageY:${pageY}`);
  console.log('------------');
});
*/
//......
//Tag 3 Klick Header start Dragging

// Offset zur linken oberen Ecke der Box (Differenz zwischen Klickposition und Box-Position)
let offsetX = 0;
let offsetY = 0;

// Breite und Höhe der Box – wichtig für Boundary-Berechnung
let boxWidth = 0;
let boxHeight = 0;

// Maximale Höhe und Breite des Viewports (sichtbarer Bereich)
let maxHeight = document.documentElement.clientHeight;
let maxWidth = document.documentElement.clientWidth;

// Neue berechnete Position der Box
let newLeft = 0;
let newTop = 0;

// Flag ob gerade gezogen wird
let draggable = false;

// Mouse Events für Dragging
// Wenn die Maus auf dem Header gedrückt wird:
// - Position der Box mit getBoundingClientRect() holen
// - Offset berechnen (wie weit vom linken/oberen Rand der Box geklickt wurde)
// - Boxbreite/-höhe speichern (für Boundary)
// - draggable aktivieren
// - preventDefault() verhindert Textmarkierung während des Dragging
dragHead.addEventListener('mousedown', (e) => {
  const rect = dragBox.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  boxWidth = rect.width;
  boxHeight = rect.height;
  draggable = true;
  e.preventDefault();
});

// Mouseup beendet das Dragging — egal wo auf dem Dokument
// Dadurch kann man die Box auch dann loslassen, wenn man den Header während des Dragging verlässt
document.addEventListener('mouseup', (e) => {
  draggable = false;
});

// Mousemove:
// - Nur ausführen, wenn draggable = true
// - neue Position berechnen (Mausposition minus Offset)
// - Clamping: Box innerhalb des Viewports halten
//   -> nie kleiner als 0 (linke/ober Grenze)
//   -> nie größer als viewport - boxSize (rechte/untere Grenze)
// - transform in requestAnimationFrame setzen (GPU-beschleunigt, flüssiges Dragging)
document.addEventListener('mousemove', (e) => {
  if (!draggable) return;
  let proposedLeft = e.clientX - offsetX;
  let proposedTop = e.clientY - offsetY;
  newLeft = Math.min(Math.max(proposedLeft, 0), maxWidth - boxWidth);
  newTop = Math.min(Math.max(proposedTop, 0), maxHeight - boxHeight);

  requestAnimationFrame(() => {
    dragBox.style.transform = `translate(${newLeft}px,${newTop}px)`;
  });
});
//.....
