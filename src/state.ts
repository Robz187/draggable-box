import { CreateBoxOptions, DEFAULT_CONFIG } from "./types";

// REFACTOR LEARNING: Global mutable state breaks reactive patterns
// Problem: Changes to these variables are invisible to other parts of the app
// No way to "listen" for changes - you have to manually check the values
//
// Why this matters for Angular:
// Angular UI components need to react to state changes automatically
// When state changes, the UI should update without manual DOM manipulation
//
// Solution: Use RxJS BehaviorSubject to make state observable
// Example pattern:
// interface AppState {
//   boxes: CreateBoxOptions[];
//   nextBoxId: number;
//   nextZIndex: number;
// }
// const state$ = new BehaviorSubject<AppState>({
//   boxes: [],
//   nextBoxId: 1,
//   nextZIndex: 0
// });
//
// Now anyone can subscribe: state$.subscribe(newState => console.log(newState))
// This is the foundation of how Angular services manage state
const dragBoxList: CreateBoxOptions[] = [];
let boxId = 1;
let zIndex = 0;
let topIndex = 1;

export function createNewBox(): CreateBoxOptions {
    // REFACTOR LEARNING: Side effects make code unpredictable
    // Current problems:
    // 1. boxId++, zIndex++, topIndex++ mutate global variables
    // 2. dragBoxList.push() mutates the array
    // 3. Hard to test - you need to reset globals between tests
    // 4. Can't track history of state changes
    //
    // Better pattern: Immutable updates with BehaviorSubject
    // const updateState = (updater: (state: AppState) => AppState): void => {
    //   const currentState = state$.value;
    //   const newState = updater(currentState); // Pure function, no mutations
    //   state$.next(newState); // Notify all subscribers
    // };
    //
    // createNewBox(): void {
    //   updateState(state => ({
    //     ...state,  // Spread existing state
    //     boxes: [...state.boxes, buildNewBox(state)],  // New array, not mutated
    //     nextBoxId: state.nextBoxId + 1  // New value
    //   }));
    // }
    //
    // Key principle: Never mutate, always create new objects/arrays
    // This is how Angular detects changes and updates the UI
    const newBoxItem: CreateBoxOptions = {
        config: DEFAULT_CONFIG,
        id: boxId , 
        zIndex: zIndex,
        position:{
            x:0,
            y:0
        }
    }
    boxId++;
    zIndex++;
    topIndex++;
    dragBoxList.push(newBoxItem);
    console.log(dragBoxList);
    return newBoxItem;
}

export function bringBoxToFront(id : number): number{
    // REFACTOR LEARNING: Mutating objects in place is invisible to observers
    // Problem: dragBoxList[boxIndex].zIndex = topIndex
    // This changes the object, but nothing "sees" the change happen
    //
    // Why this matters: Angular needs to know when data changes to update the UI
    // If you mutate an object, Angular might not detect the change
    //
    // Immutable pattern using .map() to create new objects:
    // updateState(state => ({
    //   ...state,
    //   boxes: state.boxes.map(box =>
    //     box.id === id ? { ...box, zIndex: maxZ + 1 } : box  // New object
    //   )
    // }));
    //
    // Now every change creates a new reference, which observers can detect
    // This is the foundation of Angular's change detection system
    const boxIndex = dragBoxList.findIndex(box => box.id === id);
    const newZIndex = dragBoxList[boxIndex].zIndex = topIndex;
    topIndex++;
    return newZIndex;
}

export function deleteBox(id : number) {
    // REFACTOR LEARNING: splice() mutates the original array
    // Problem: When you splice(), other parts of the app don't know the array changed
    //
    // Better: filter() creates a new array without the deleted item
    // updateState(state => ({
    //   ...state,
    //   boxes: state.boxes.filter(box => box.id !== id)  // Returns new array
    // }));
    //
    // Why this matters for Angular:
    // - New array reference = Angular knows to re-render the list
    // - Old array reference = Angular thinks nothing changed
    // - This is why you use .filter(), .map(), [...array] instead of mutations
    // - Essential for proper UI updates and performance optimization
    const boxIndex = dragBoxList.findIndex(box => box.id === id);
    dragBoxList.splice(boxIndex, 1);
    console.log(dragBoxList);
}

// ==============================================================================
// FAZIT: Was macht die Principle Developer Lösung (https://stackblitz.com/edit/vitejs-vite-1zfbu7en) besser?
// ==============================================================================
//
// Vergleiche diese Datei mit meinem stackblitz /src/state.ts - dort siehst du eine
// professionelle State-Management Lösung. Hier die wichtigsten Unterschiede:
//
// 1. BEHAVIORSUBJECT ALS REAKTIVER STATE CONTAINER
//    Principle: const state$ = new BehaviorSubject<AppState>(initialState);
//    Rookie: const dragBoxList: CreateBoxOptions[] = [];
//    
//    Vorteil:
//    - Alle können den State beobachten: state$.subscribe(...)
//    - Automatische Benachrichtigung bei Änderungen
//    - Neue Subscriber bekommen sofort den aktuellen Wert
//    - Foundation für Angular Services
//
// 2. FACTORY PATTERN FÜR TESTBARKEIT
//    Principle: export const createStateManager = (initialState?: AppState) => {...}
//    Rookie: Globale Variablen ohne Kapselung
//    
//    Vorteil:
//    - Tests können eigenen State injecten
//    - Isolierte Instanzen möglich
//    - Dependency Injection ready (wie Angular Services)
//    - Kein Reset von Globals zwischen Tests nötig
//
// 3. IMMUTABILITÄT DURCHGEHEND
//    Principle: return { ...state, boxes: [...state.boxes, newBox] };
//    Rookie: dragBoxList.push(newBox); boxId++; zIndex++;
//    
//    Vorteil:
//    - Object.freeze() für Konstanten
//    - Spread Operator für Updates
//    - Keine Mutationen = Angular Change Detection funktioniert
//    - State History trackbar (undo/redo möglich)
//
// 4. PURE FUNCTIONS ALS STATE UPDATER
//    Principle: const updateState = (updater: StateUpdater): void => {
//              state$.next(updater(state$.value));
//            };
//    Rookie: Direkte Manipulationen überall verstreut
//    
//    Vorteil:
//    - Updater-Funktion ist pure (gleicher Input = gleicher Output)
//    - Einfach zu testen
//    - Klare Trennung von State-Logik
//    - Zentrale Stelle für alle State-Updates
//
// 5. PERFORMANCE-OPTIMIERTE SELECTORS
//    Principle: const selectBoxes = (): Observable<ReadonlyArray<Box>> => 
//              state$.pipe(
//                map(state => state.boxes),
//                distinctUntilChanged(boxesEqual),  // Custom Equality
//                shareReplay({ bufferSize: 1, refCount: true })  // Caching
//              );
//    Rookie: Kein Konzept von Selectors, direkter Array-Zugriff
//    
//    Vorteil:
//    - distinctUntilChanged verhindert unnötige Re-Renders
//    - shareReplay für Multi-Subscriber (Performance)
//    - Custom Equality Function für Arrays
//    - Observable API = Angular Template Async Pipe ready
//
// 6. STRING IDS MIT TIMESTAMP + RANDOM
//    Principle: `box-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
//    Rookie: let boxId = 1; boxId++;
//    
//    Vorteil:
//    - Keine globalen Counter nötig
//    - Collision-resistant
//    - Unabhängig generierbar (auch in verteilten Systemen)
//    - Standard in modernen Web-Apps (vorbereitet für UUIDs)
//
// 7. KOMPOSITION STATT MUTATION
//    Principle: const updateBoxInArray = (boxes, boxId, position) =>
//              boxes.map(box => 
//                box.id === boxId ? { ...box, x: position.x, y: position.y } : box
//              );
//    Rookie: dragBoxList[boxIndex].zIndex = topIndex;
//    
//    Vorteil:
//    - Pure Helper Functions
//    - Wiederverwendbar
//    - Einfach zu testen
//    - Funktionale Programmierung (map, filter, reduce)
//
// 8. CLEAR PUBLIC API
//    Principle: return {
//              selectBoxes,
//              selectDragState,
//              addBox,
//              removeBox,
//              // ...
//            };
//    Rookie: Alle Functions sind export, keine Kapselung
//    
//    Vorteil:
//    - Nur exports was nötig ist
//    - Private Functions bleiben im Closure
//    - Klare Schnittstelle
//    - Kann interne Implementation ändern ohne Breaking Changes
//
// 9. COMPREHENSIVE JSDOC
//    Principle: Jede Funktion dokumentiert mit @param, @returns, @private
//    Rookie: Keine Dokumentation
//    
//    Vorteil:
//    - IDE zeigt Dokumentation beim Hovern
//    - Team-Kollegen verstehen Code schneller
//    - @private markiert interne Functions
//    - Professionelle Code-Qualität
//
// 10. TYPE SAFETY ÜBERALL
//     Principle: type StateUpdater = (state: AppState) => AppState;
//             ReadonlyArray<Box>
//     Rookie: Partial Types, keine Custom Types
//     
//     Vorteil:
//     - Custom Types für Klarheit
//     - Readonly Arrays verhindern Mutationen
//     - Compile-time Sicherheit
//     - TypeScript nutzt seine volle Kraft
//
// ==============================================================================
// WARUM IST DAS ANGULAR-READY?
// ==============================================================================
//
// Diese Patterns sind EXAKT das, was Angular Services nutzen:
//
// Angular Service Pattern:
// @Injectable()
// export class BoxService {
//   private state$ = new BehaviorSubject<AppState>(initialState);
//   
//   boxes$ = this.state$.pipe(
//     map(state => state.boxes),
//     distinctUntilChanged()
//   );
//   
//   addBox(position: Position): void {
//     this.updateState(state => ({
//       ...state,
//       boxes: [...state.boxes, this.createBox(state, position)]
//     }));
//   }
// }
//
// Component Usage:
// export class BoxComponent {
//   boxes$ = this.boxService.boxes$;  // Subscribe in template
//   
//   onAddClick(): void {
//     this.boxService.addBox({ x: 100, y: 100 });
//   }
// }
//
// Template:
// <div *ngFor="let box of boxes$ | async">{{box.title}}</div>
//
// ==============================================================================
// FAZIT: Das ist keine Over-Engineering
// ==============================================================================
//
// Diese Patterns sind STANDARD-ARCHITEKTUR für:
// - Wartbare Anwendungen
// - Skalierbare Codebases
// - Team-Kollaboration
// - Angular/React/Vue Enterprise Apps
//
// Wenn du diese Patterns in TypeScript beherrschst, sind folgende Konzepte
// sofort verständlich:
// - Angular Services mit RxJS
// - NgRx (Redux für Angular)
// - ComponentStore
// - React Hooks mit useReducer
// - Vue 3 Composition API
//
// Master diese Basics hier, und Angular wird sich natürlich anfühlen!