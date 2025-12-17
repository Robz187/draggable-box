import { fromEvent } from "rxjs";
import { makeDraggable } from "./drag";
import { createNewBox, deleteBox } from "./state";
import { CreateBoxOptions } from "./types";

// REFACTOR LEARNING: This function does too many things at once
// Current approach: initialization + event handling + DOM creation all mixed together
//
// Better: Separate concerns into focused functions
// - State management: One module that manages the boxes array
// - View rendering: One function that takes data and renders it
// - Event handling: One function that connects user actions to state updates
//
// Pattern to learn:
// 1. State service exposes an Observable: boxes$ = new BehaviorSubject<Box[]>([])
// 2. View subscribes to state: boxes$.subscribe(boxes => renderBoxes(boxes))
// 3. User actions update state: addButton.click -> state.addBox()
// 4. State change triggers re-render automatically
//
// This separation is how Angular works:
// - Services manage state and business logic
// - Components handle presentation and user interaction
// - Data flows in one direction: State -> View
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
    // REFACTOR: Imperative DOM manipulation breaks the reactive flow
    // Problem: Manually creating and appending elements
    // Better: Use RxJS to connect button clicks to state updates
    //
    // Reactive approach:
    // fromEvent(createBtn, 'click').pipe(
    //   tap(() => this.boxService.addBox())
    // ).subscribe();
    //
    // Then separately subscribe to state changes for rendering:
    // this.boxService.selectBoxes().subscribe(boxes => {
    //   this.renderBoxes(container, boxes); // Declarative render
    // });
    //
    // Benefits:
    // - Single source of truth (state)
    // - Rendering is purely a function of state
    // - Easy to test (mock the service)
    // - This is how Angular's template binding works under the hood
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
    // REFACTOR LEARNING: This function does too much
    // Current: Creates structure + sets styles + attaches events all at once
    //
    // Better approach: Make this a pure rendering function
    // Pure function principle: Same input always produces same output, no side effects
    //
    // renderBox(boxData: Box): HTMLElement {
    //   const element = createElement('div');
    //   setElementStyles(element, boxData);  // Pure function
    //   return element;  // No event listeners attached here
    // }
    //
    // Then separately:
    // const element = renderBox(boxData);
    // attachEventHandlers(element, boxData.id);
    //
    // Why separate these?
    // - renderBox() can be tested without DOM events
    // - Can re-render without re-attaching events
    // - Can reuse renderBox() in different contexts
    // - This matches how Angular separates templates from event handlers
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
    // REFACTOR: Potential memory leak - event listeners not cleaned up
    // Problem: When element is removed, listener might persist
    //
    // Better approach using RxJS (Angular-style):
    // private destroy$ = new Subject<void>();
    //
    // fromEvent(delBtn, 'click').pipe(
    //   tap(() => this.boxService.deleteBox(boxId)),
    //   takeUntil(this.destroy$)
    // ).subscribe();
    //
    // Then in cleanup/ngOnDestroy:
    // this.destroy$.next();
    // this.destroy$.complete();
    //
    // Also notice: dragBox.remove() is imperative
    // Better: Delete from state, let reactive rendering handle DOM updates
    // State update -> Observable emits -> View updates automatically
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

// ==============================================================================
//  Was macht die Principle Lösung (https://stackblitz.com/edit/vitejs-vite-1zfbu7en) besser?
// ==============================================================================
//
// Vergleiche mit my-dragbox/src/view.ts - eine professionelle View-Layer Lösung
//
// 1. TRENNUNG VON RENDERING UND EVENT HANDLING
//    Principle: setupEventStreams() - einmalig, zentral, wiederverwendbar
//            updateDOM() - pure Render-Funktion
//    Rookie: createBox() macht beides gleichzeitig
//    
//    Vorteil:
//    - Event Streams werden einmal erstellt, nicht pro Box
//    - Rendering kann isoliert getestet werden
//    - Events können unabhängig von DOM-Elementen gehandhabt werden
//    - Event Delegation statt individueller Listener (Performance!)
//
// 2. ELEMENT CACHE FÜR EFFIZIENZ
//    Principle: const boxElements = new Map<string, HTMLElement>();
//    Rookie: Jedes Mal neue Elemente erstellen, alte wegwerfen
//    
//    Vorteil:
//    - Update statt Recreation (schneller)
//    - Behält DOM-Referenzen (wichtig für Animationen)
//    - Kein Layout-Thrashing
//    - Weniger Garbage Collection
//
// 3. REAKTIVES RENDERING
//    Principle: selectBoxes().subscribe(boxes => updateDOM(container, boxes))
//    Rookie: Manuelles appendChild bei jedem Click
//    
//    Vorteil:
//    - State als Single Source of Truth
//    - Rendering ist pure Funktion des States
//    - Automatische Updates bei State-Änderungen
//    - Wie Angular's Change Detection
//
// 4. EFFIZIENTE DOM UPDATES
//    Principle: updateDOM() - vergleicht aktuellen State mit DOM
//            - Fügt nur neue Boxen hinzu
//            - Entfernt nur gelöschte Boxen
//            - Updated nur geänderte Properties
//    Rookie: Immer komplette Box neu erstellen
//    
//    Vorteil:
//    - Minimale DOM Manipulationen
//    - Bessere Performance bei vielen Boxen
//    - Smooth Animationen
//    - Virtual DOM Prinzip (React/Angular)
//
// 5. RXJS EVENT STREAMS MIT EVENT DELEGATION
//    Principle: fromEvent(container, 'click').pipe(
//              map(e => getClosestWithData(e.target, '[data-close]')),
//              filter(element => element !== null),
//              tap(element => removeBox(element.dataset.id))
//            ).subscribe();
//    Rookie: delBtn.addEventListener('click', () => ...)
//    
//    Vorteil:
//    - Ein Listener für alle Boxen (Event Delegation)
//    - Funktioniert auch für dynamisch hinzugefügte Boxen
//    - RxJS Operators für Daten-Transformation
//    - Automatic Cleanup mit takeUntil
//
// 6. PROPER SUBSCRIPTION MANAGEMENT
//    Principle: const eventSubscriptions = new Subscription();
//            eventSubscriptions.add(closeSub);
//            eventSubscriptions.add(frontSub);
//            export const cleanupEventStreams = () => {
//              eventSubscriptions.unsubscribe();
//              boxElements.clear();
//            };
//    Rookie: Keine Cleanup-Strategie
//    
//    Vorteil:
//    - Memory Leaks verhindert
//    - Saubere Ressourcen-Verwaltung
//    - Wichtig für SPAs (mount/unmount)
//    - Wie Angular's ngOnDestroy
//
// 7. TRANSFORM STATT TOP/LEFT
//    Principle: element.style.transform = `translate(${x}px, ${y}px)`;
//    Rookie: Mischt verschiedene Ansätze
//    
//    Vorteil:
//    - Hardware-Beschleunigung (GPU)
//    - Bessere Performance
//    - Smooth Animationen
//    - Kein Layout-Reflow (nur Composite)
//
// 8. SEPARATION: CREATE vs UPDATE
//    Principle: createBoxElement() - erstellt einmal
//            updateBoxStyles() - updated bei Änderungen
//    Rookie: Alles in createBox()
//    
//    Vorteil:
//    - Klare Verantwortlichkeiten
//    - Kann updaten ohne neu zu erstellen
//    - Testbar
//    - Wiederverwendbar
//
// 9. TYPE-SAFE DOM QUERIES
//    Principle: const getClosestWithData = <T extends HTMLElement>(
//              target: HTMLElement, 
//              selector: string
//            ): T | null => target.closest(selector) as T | null;
//    Rookie: options.id!.toString() - Force-Cast mit !
//    
//    Vorteil:
//    - TypeScript hilft bei DOM-Operationen
//    - Explizit mit null umgehen
//    - Weniger Runtime-Errors
//    - Bessere IDE-Unterstützung
//
// 10. THROTTLING FÜR PERFORMANCE
//     Principle: mouseMove$.pipe(throttleTime(16)) // 60fps
//     Rookie: Kein Throttling
//     
//     Vorteil:
//     - Verhindert zu viele Updates
//     - Bessere Performance
//     - Smooth visuelle Effekte
//     - Battery-friendly (Mobile)
//
// ==============================================================================
// WARUM IST DAS ANGULAR-READY?
// ==============================================================================
//
// Angular Component Pattern:
//
// @Component({
//   selector: 'app-box',
//   template: `
//     <div class="container">
//       <div *ngFor="let box of boxes$ | async"
//            [style.transform]="getTransform(box)"
//            (click)="onBoxClick(box.id)">
//         {{box.title}}
//       </div>
//     </div>
//   `
// })
// export class BoxComponent implements OnInit, OnDestroy {
//   boxes$ = this.boxService.selectBoxes();  // Observable subscription
//   private destroy$ = new Subject<void>();
//   
//   ngOnInit(): void {
//     this.setupEventHandlers();
//   }
//   
//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
//   
//   getTransform(box: Box): string {
//     return `translate(${box.x}px, ${box.y}px)`;  // Pure function
//   }
//   
//   onBoxClick(boxId: string): void {
//     this.boxService.bringToFront(boxId);  // State update
//   }
// }
//
// Die Patterns aus der Principle-Lösung sind direkt übertragbar:
// - Observable Subscriptions -> async pipe
// - Pure render functions -> Template bindings
// - Event streams -> Template event bindings
// - Subscription management -> ngOnDestroy
// - Element cache -> Angular's own change detection
//
// ==============================================================================
// KEY LEARNINGS FÜR VIEW LAYER
// ==============================================================================
//
// 1. SEPARATE CONCERNS: Rendering, Event Handling, State Management
// 2. USE EVENT DELEGATION: Ein Listener statt hunderte
// 3. CACHE DOM ELEMENTS: Update statt Recreation
// 4. REACTIVE RENDERING: State -> Render, nicht Click -> Append
// 5. SUBSCRIPTION CLEANUP: Immer aufräumen
// 6. USE TRANSFORM: Hardware-beschleunigt, performant
// 7. THROTTLE EVENTS: Nicht jeden Frame rendern
// 8. TYPE-SAFE DOM: TypeScript auch für DOM-Operationen nutzen
// 9. PURE RENDER FUNCTIONS: Gleicher Input = Gleicher Output
// 10. THINK DECLARATIVE: "Was soll gezeigt werden" statt "Wie ändern"
//
// Diese View-Patterns bereiten dich perfekt auf Angular Templates vor!
