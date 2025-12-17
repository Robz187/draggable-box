import { fromEvent, switchMap, map, takeUntil, buffer, debounceTime, filter } from "rxjs";
import { bringBoxToFront } from "./state";

// REFACTOR LEARNING: Tight coupling makes code hard to reuse and test
// Current issues:
// 1. makeDraggable() does EVERYTHING: captures events, calculates position, updates DOM
// 2. Directly manipulates DOM (style.transform, style.background)
// 3. Hard-coded dependencies on #app and #header elements
// 4. Can't reuse this for other draggable elements
// 5. No way to clean up subscriptions (memory leak)
//
// Better approach: Separate "what happened" from "what to do about it"
//
// Step 1: Create drag stream that only emits position data
// createDragStream(element: HTMLElement): Observable<{x: number, y: number}> {
//   return mouseDown$.pipe(
//     switchMap(() => mouseMove$.pipe(
//       map(e => ({ x: e.clientX, y: e.clientY })),  // Just data, no DOM
//       takeUntil(mouseUp$)
//     ))
//   );
// }
//
// Step 2: Consumer decides what to do with the data
// createDragStream(boxHeader).subscribe(pos => updateBoxPosition(boxId, pos));
//
// This separation is crucial for Angular:
// - Directives emit events/data
// - Components handle the events
// - Services manage state
// Each layer has one clear responsibility
export function makeDraggable(dragBox: HTMLElement, dragHead: HTMLElement): void {

    let app = document.getElementById('app');
    let header = document.getElementById('header');
    // GOOD: Using RxJS observables for events
    // This is correct and matches Angular's reactive approach
    const mouseDown$ = fromEvent<MouseEvent>(dragHead, 'mousedown');
    const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');
    const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
    
    // LEARNING: Each makeDraggable() call creates new event listeners
    // Problem: If you have 10 boxes, you have 10 separate mouseMove listeners
    // Better: Share event streams across all boxes
    //
    // Pattern for shared streams:
    // const mouseMove$ = fromEvent(document, 'mousemove').pipe(share());
    // const mouseUp$ = fromEvent(document, 'mouseup').pipe(share());
    //
    // share() operator creates one listener that multiple subscribers use
    // Now 10 boxes share 1 listener instead of creating 10 listeners
    //
    // Why this matters:
    // - Better performance (fewer DOM listeners)
    // - Foundation for Angular services that provide shared streams
    // - Teaches you to think about resource management
    const doubleClick$ = mouseDown$.pipe(
        buffer(mouseDown$.pipe(debounceTime(250))),
        map(mouseDown => mouseDown.length),
        filter(mouseDownLength => mouseDownLength >= 2)
    );

    // REFACTOR LEARNING: This subscription does too many things
    // Current: Calculates position + updates state + changes colors + modifies DOM
    // Problem: Hard to test, hard to reuse, logic is tangled
    //
    // Better reactive pattern:
    // 1. Stream emits data (positions, ids, etc.)
    // 2. Data transformations happen in operators (map, filter)
    // 3. Side effects only in subscription (state updates)
    // 4. DOM updates happen via separate state subscriptions
    //
    // Example structure:
    // const dragPositions$ = mouseDown$.pipe(
    //   switchMap(() => mouseMove$.pipe(
    //     map(e => calculatePosition(e)),  // Pure calculation
    //     takeUntil(mouseUp$)
    //   ))
    // );
    //
    // dragPositions$.subscribe(pos => updateBoxState(boxId, pos));  // State only
    //
    // boxState$.subscribe(box => renderBox(element, box));  // Rendering only
    //
    // This separation is how Angular works:
    // - Observable streams for data flow
    // - Template bindings for rendering
    // - Services for state management
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
            // REFACTOR LEARNING: Directly manipulating DOM in subscriptions
            // Current flow: Event -> Calculate -> Update DOM directly
            // Problem: State and DOM can get out of sync
            //
            // Better flow: Event -> Update state -> State triggers render
            // dragPositions$.subscribe(pos => updateBoxPosition(boxId, pos));
            // boxState$.subscribe(box => element.style.transform = ...);
            //
            // Key concept: Unidirectional data flow
            // User action -> State change -> UI update
            // Never: User action -> UI update (bypassing state)
            dragTransform(position.newLeft, position.newTop);
            displayPosition(position.newLeft,position.newTop);
        })

    // REFACTOR LEARNING: Memory leak - subscriptions never cleaned up
    // Problem: Every box creates subscriptions, but they're never unsubscribed
    // If you create/delete 100 boxes, you'll have 100+ zombie subscriptions
    //
    // Pattern to learn:
    // const subscriptions = new Subscription();  // Container
    // subscriptions.add(mouseUp$.subscribe(...));
    // subscriptions.add(mouseDown$.subscribe(...));
    //
    // Then return cleanup function:
    // return () => subscriptions.unsubscribe();  // Clean up everything
    //
    // Why this matters:
    // - Memory leaks slow down apps over time
    // - Angular components use ngOnDestroy() for cleanup
    // - Learning proper cleanup now builds good habits
    mouseUp$.subscribe(() => setColor('rgb(38, 146, 141)'));
    doubleClick$.subscribe(()=> {
        const rect = dragBox.getBoundingClientRect();
        requestAnimationFrame(()=> {
            dragBox.style.height = `${rect.height * 1.3}px`;
            dragBox.style.width = `${rect.width * 1.3}px`;
        })
    })
    
    // LEARNING: Good - helper functions for organization
    // BUT they're doing the wrong thing for reactive architecture
    //
    // Current: dragTransform() -> element.style.transform = ...
    // This is imperative (you tell it HOW to change)
    //
    // Better reactive approach:
    // 1. updateBoxPosition(boxId, x, y) -> Updates state (data)
    // 2. boxState$.subscribe() -> Renders based on state
    //
    // Think declarative instead of imperative:
    // BAD (imperative):  "Set the transform to X, then set color to Y"
    // GOOD (declarative): "When position is X, transform should be Y" 
    //
    // These functions should return style values, not apply them:
    // const getTransformStyle = (x: number, y: number): string =>
    //   `translate(${x}px, ${y}px)`;
    //
    // Then: element.style.transform = getTransformStyle(box.x, box.y);
    //
    // This style (pure functions + reactive rendering) is Angular's foundation
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

// KEY TAKEAWAYS for Angular preparation:
//
// 1. REACTIVE STATE: Use BehaviorSubject to make data observable
//    - State changes emit automatically
//    - Multiple subscribers can react to same state
//
// 2. IMMUTABILITY: Never mutate objects/arrays
//    - Always create new objects with spread operator {...}
//    - Use .map(), .filter() instead of .push(), .splice()
//    - This is how Angular detects changes
//
// 3. SEPARATION: Split data flow from side effects
//    - Observables transform data (map, filter, switchMap)
//    - Subscriptions trigger actions (state updates)
//    - Rendering subscribes to state separately
//
// 4. UNIDIRECTIONAL FLOW: Event -> State -> Render
//    - Never bypass state to update UI directly
//    - State is single source of truth
//
// 5. CLEANUP: Always unsubscribe to prevent memory leaks
//    - Collect subscriptions in Subscription container
//    - Unsubscribe when component/element is destroyed
//
// These patterns are exactly how Angular applications work.
// Master these in TypeScript, and Angular will make sense immediately.

// ==============================================================================
// Was macht die Principle Lösung (https://stackblitz.com/edit/vitejs-vite-1zfbu7en) besser?
// ==============================================================================
//
// Vergleiche mit stackblitz src/drag.ts - professionelle Drag-Logic
//
// 1. SHARED EVENT STREAMS
//    Principle: const mouseMove$ = fromEvent(document, 'mousemove').pipe(share());
//            const mouseUp$ = fromEvent(document, 'mouseup').pipe(share());
//            // Einmal erstellt, von allen genutzt
//    Rookie: Jede Box erstellt eigene Event Streams
//    
//    Vorteil:
//    - 10 Boxen = 1 Listener statt 10 Listener
//    - Weniger Memory
//    - Bessere Performance
//    - share() Operator sorgt für Multicast
//
// 2. TRENNUNG: DRAG LOGIC vs DOM MANIPULATION
//    Principle: setupDragSystem() erstellt Streams
//            Streams emittieren nur Positions-Daten
//            State-Update passiert separat
//            DOM-Update durch View-Subscription zu State
//    Rookie: Alles in makeDraggable() - Logic + DOM + State gemischt
//    
//    Vorteil:
//    - Drag-Logic ist wiederverwendbar
//    - Testbar ohne DOM
//    - DOM-Updates sind getrennt von Business-Logic
//    - Wie Angular Directives funktionieren
//
// 3. ANIMATION FRAME SCHEDULER
//    Principle: observeOn(animationFrameScheduler)
//    Rookie: requestAnimationFrame in jeder Helper-Function
//    
//    Vorteil:
//    - RxJS managed das Scheduling
//    - Synchronisiert mit Browser Repaint
//    - 60fps garantiert
//    - Ein Operator statt viele Wrapper-Functions
//
// 4. WITH LATEST FROM PATTERN
//    Principle: mouseMove$.pipe(
//              withLatestFrom(boxes$),
//              map(([e, boxes]) => ...)
//            )
//    Rookie: Globale Variablen abfragen
//    
//    Vorteil:
//    - Kombiniert Streams reactive
//    - Immer aktueller State
//    - Keine Race Conditions
//    - Standard RxJS Pattern
//
// 5. TYPE-SAFE POSITION CALCULATIONS
//    Principle: const calculateBoundedPosition = (
//              mousePos: Position,
//              offset: Position,
//              boxSize: { width: number; height: number },
//              viewport: ViewportBounds
//            ): Position => { ... }
//    Rookie: Berechnungen inline im Subscription
//    
//    Vorteil:
//    - Pure Function - testbar
//    - Wiederverwendbar
//    - Type-Safety
//    - Klare Inputs/Outputs
//
// 6. FILTER PATTERN FÜR NULL SAFETY
//    Principle: filter((data): data is NonNullable<typeof data> => data !== null)
//    Rookie: Überall ! Force-Casts
//    
//    Vorteil:
//    - TypeScript Type Guard
//    - Compile-Time Safety
//    - Explizite null-Behandlung
//    - Verhindert Runtime-Errors
//
// 7. CENTRALIZED CLEANUP
//    Principle: const dragSubscriptions = new Subscription();
//            dragSubscriptions.add(dragMoveSub);
//            dragSubscriptions.add(dragEndSub);
//            export const cleanupDragSystem = () => {
//              dragSubscriptions.unsubscribe();
//            };
//    Rookie: Keine Cleanup-Strategie
//    
//    Vorteil:
//    - Memory Leaks verhindert
//    - Sauberes Shutdown
//    - Wichtig für SPAs
//    - Professionelles Resource Management
//
// 8. BOUNDARY CALCULATIONS
//    Principle: const clamp = (value: number, min: number, max: number): number =>
//              Math.max(min, Math.min(value, max));
//            const calculateBoundedPosition = (...) => {
//              return {
//                x: clamp(x, 0, maxX),
//                y: clamp(y, 0, maxY)
//              };
//            };
//    Rookie: Math.min(Math.max(...)) inline
//    
//    Vorteil:
//    - Lesbar
//    - Wiederverwendbar
//    - Testbar
//    - Standard FP Pattern
//
// 9. SEPARATE DRAG START/MOVE/END STREAMS
//    Principle: Drei separate Subscriptions:
//            - dragMoveSub für Bewegung
//            - dragEndSub für Ende
//            - Klare Verantwortlichkeiten
//    Rookie: Alles in einem großen Subscription-Block
//    
//    Vorteil:
//    - Einfacher zu verstehen
//    - Einfacher zu erweitern
//    - Einfacher zu debuggen
//    - Single Responsibility Principle
//
// 10. FIND BOX BY ID HELPER
//     Principle: const findBoxById = (boxes: ReadonlyArray<Box>, boxId: string) =>
//               boxes.find(box => box.id === boxId);
//     Rookie: Direct array manipulation
//     
//     Vorteil:
//     - Abstraction
//     - Type-Safe
//     - Testbar
//     - Kann erweitert werden (z.B. Caching)
//
// ==============================================================================
// ANGULAR DIRECTIVE PATTERN
// ==============================================================================
//
// Die Principle-Lösung entspricht einer Angular Directive:
//
// @Directive({
//   selector: '[appDraggable]'
// })
// export class DraggableDirective implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();
//   
//   @Input() dragHandle?: HTMLElement;
//   @Output() dragStart = new EventEmitter<Position>();
//   @Output() dragMove = new EventEmitter<Position>();
//   @Output() dragEnd = new EventEmitter<void>();
//   
//   constructor(
//     private el: ElementRef,
//     private dragService: DragService  // Shared streams!
//   ) {}
//   
//   ngOnInit(): void {
//     const handle = this.dragHandle || this.el.nativeElement;
//     
//     this.dragService.createDragStream(handle).pipe(
//       takeUntil(this.destroy$)
//     ).subscribe(pos => {
//       this.dragMove.emit(pos);  // Emit data, don't manipulate DOM
//     });
//   }
//   
//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }
//
// Usage in template:
// <div appDraggable 
//      (dragMove)="onDragMove($event)"
//      [style.transform]="getTransform(box)">
// </div>
//
// Key principle: Directive emittiert Daten, Component entscheidet was passiert
//
// ==============================================================================
// ZUSAMMENFASSUNG: DRAG SYSTEM PATTERNS
// ==============================================================================
//
// Was du aus der Principle-Lösung lernen kannst:
//
// 1. SHARE EVENT STREAMS: Ein Listener für alle, nicht einer pro Element
// 2. SEPARATE CONCERNS: Logic, State, DOM sind getrennte Schichten
// 3. USE SCHEDULERS: animationFrameScheduler für smooth Performance
// 4. COMBINE STREAMS: withLatestFrom, combineLatest für reactive Daten
// 5. PURE CALCULATIONS: Position-Berechnungen ohne Side Effects
// 6. TYPE GUARDS: filter() mit Type Predicates für null safety
// 7. CENTRALIZED CLEANUP: Eine Stelle für alle Unsubscriptions
// 8. HELPER FUNCTIONS: clamp, calculateBounded, findById - wiederverwendbar
// 9. CLEAR SUBSCRIPTIONS: dragStart, dragMove, dragEnd getrennt
// 10. EMIT DATA, NOT SIDE EFFECTS: Streams emittieren Daten, Consumer handeln
//
// Diese Patterns machen dich bereit für:
// - Angular Custom Directives
// - Complex User Interactions
// - Performance-optimierte Apps
// - Wiederverwendbare Logic
// - Testbare Code-Basen
//
// Das Drag-System ist oft das Komplexeste in einer UI - wenn du das reactive
// lösen kannst, kannst du jede User Interaction in Angular lösen!