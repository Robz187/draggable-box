import './style.css'
import { createApp } from './view';

// REFACTOR LEARNING: This entry point is too simple and missing key patterns
//
// Current issues:
// 1. No DOMContentLoaded check - createApp() runs before DOM is ready
//    Risk: Elements might not exist yet, causing errors
//
// 2. No subscription management - can't clean up when app is destroyed
//    Risk: Memory leaks in Single Page Applications
//
// 3. No reactive subscriptions to state changes
//    Problem: State updates don't automatically trigger UI updates
//
// Better pattern (compare with my-dragbox/main.ts):
//
// const subscriptions = new Subscription();  // Collect all subscriptions
//
// const initApp = (): void => {
//   const appContainer = document.getElementById('app');
//   if (!appContainer) {
//     throw new Error('App container not found');  // Fail fast with clear error
//   }
//
//   setupEventStreams(appContainer);  // Initialize event handling
//   setupDragSystem();  // Initialize drag behavior
//
//   // Subscribe to state changes for reactive rendering
//   subscriptions.add(
//     selectBoxes().subscribe(boxes => updateDOM(appContainer, boxes))
//   );
//
//   subscriptions.add(
//     selectBoxCount().subscribe(count => updateCounter(count))
//   );
//
//   addBox(100, 100);  // Create initial box
// };
//
// // Wait for DOM to be ready
// document.addEventListener('DOMContentLoaded', initApp);
//
// // Cleanup on page unload (important for SPAs)
// export const cleanup = (): void => {
//   subscriptions.unsubscribe();
//   cleanupEventStreams();
//   cleanupDragSystem();
// };
// window.addEventListener('beforeunload', cleanup);
//
// Key principles for Angular preparation:
// - Wait for DOM ready before initializing
// - Manage subscriptions in a container
// - Subscribe to state observables for automatic updates
// - Provide cleanup for resource management
// - Separate concerns (state, view, drag logic)
//
// This structure mirrors Angular component lifecycle:
// - ngOnInit() -> initApp()
// - Component subscriptions -> subscription management
// - ngOnDestroy() -> cleanup()

// Box Komponente erstellen
createApp();

// ==============================================================================
// FAZIT: Application Bootstrap Pattern
// ==============================================================================
//
// Was fehlt hier im Vergleich zu stackblitz main.ts:
//
// 1. LIFECYCLE MANAGEMENT
//    - Kein expliziter Initialization Flow
//    - Kein Cleanup Mechanism
//    - Keine Fehlerbehandlung
//
// 2. REACTIVE SETUP
//    - Keine Subscriptions zu State Observable
//    - UI updated nicht automatisch bei State-Änderungen
//    - View und State sind disconnected
//
// 3. PROPER INITIALIZATION ORDER
//    - Event Streams setup
//    - Drag System setup  
//    - State Subscriptions
//    - Initial Data Load
//
// Das ist exakt wie Angular Component Lifecycle:
// - constructor() -> Dependencies injected
// - ngOnInit() -> Setup and subscriptions
// - ngOnDestroy() -> Cleanup
//
// Learn this pattern here, understand Angular Components later!

