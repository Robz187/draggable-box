// REFACTOR LEARNING: Missing readonly modifiers
// Problem: Without readonly, properties can be mutated accidentally
// box.x = 100; // This works but breaks immutability patterns
//
// Better (compare with my-dragbox/types.ts):
// export interface Position {
//   readonly x: number;
//   readonly y: number;
// }
//
// Why readonly matters:
// - Prevents accidental mutations
// - TypeScript enforces immutability at compile time
// - Essential for reactive patterns where state updates must be explicit
// - Angular's OnPush change detection relies on reference changes
export interface Position {
  x: number;
  y: number;
}
export interface Size {
  width: number;
  height: number;
}
// REFACTOR LEARNING: Confusing separation of concerns
// Problem: BoxConfig and BoxState overlap but use different property names
// - BoxConfig has "start", BoxState has "position"
// - BoxConfig has nested header/content, BoxState is flat
// - Mixing UI concerns (colors) with data concerns (position, size)
//
// Better approach: Single Box interface that represents the data model
// export interface Box {
//   readonly id: string;  // String IDs are more flexible (UUIDs, etc)
//   readonly x: number;
//   readonly y: number;
//   readonly width: number;
//   readonly height: number;
//   readonly title: string;
//   readonly content: string;
//   readonly zIndex: number;
// }
//
// Colors and styling should be in CSS, not in state
// Keep state minimal - only data needed for business logic
export interface BoxConfig {
  header: { title: string; color: string; };
  start: Position;
  size: Size;
  content: { text: string; color: string; };
}

// REFACTOR LEARNING: id should be string, not number
// Problem: number IDs are limiting
// - Can't use UUIDs or other unique identifiers
// - Number IDs require managing a counter
// - String IDs can be generated independently (Date.now() + random)
//
// Also: Missing readonly modifiers (see Position comment above)
export interface BoxState {
  id: number;
  position: Position;
  size: Size;
  zIndex: number;
  color: string;
}

// REFACTOR LEARNING: Partial<> makes everything optional
// Problem: extends Partial<BoxState> means all properties are optional
// This makes it unclear which properties are actually required
//
// Better: Be explicit about what's optional
// interface CreateBoxParams {
//   x?: number;
//   y?: number;
// }
//
// Or don't export options at all - keep it internal to the state module
// The state module should handle box creation details
export interface CreateBoxOptions extends Partial<BoxState> {
  config?: BoxConfig;
}

// REFACTOR LEARNING: Mutable default config
// Problem: DEFAULT_CONFIG can be mutated anywhere
// Someone could write: DEFAULT_CONFIG.header.title = "Hacked!"
// This would affect all future boxes
//
// Better: Use Object.freeze() or 'as const'
// export const DEFAULT_CONFIG = Object.freeze({
//   header: Object.freeze({ title: 'Klick mich', color: 'lightgrey' }),
//   ...
// });
//
// Or use 'as const' for deep immutability:
// export const DEFAULT_CONFIG = {
//   header: { title: 'Klick mich', color: 'lightgrey' },
//   ...
// } as const;
//
// Why this matters:
// - Prevents accidental mutations of shared constants
// - TypeScript can infer literal types ('Klick mich' instead of string)
// - Safer in multi-developer environments
// ADDITIONAL LEARNING: Missing JSDoc comments
// Problem: No documentation about what each interface represents
// In Angular projects, good documentation helps team collaboration
//
// Compare with my-dragbox/types.ts which has:
// /**
//  * Represents a draggable box in the application
//  */
// export interface Box {
//   /** Unique identifier for the box */
//   readonly id: string;
//   ...
// }
//
// Benefits:
// - IDE shows documentation on hover
// - Easier for other developers to understand
// - Helps you remember what you wrote months later
export const DEFAULT_CONFIG: BoxConfig = {
    header: {
      title: 'Klick mich',
      color: 'lightgrey'
    },
    start: {
      x: 0,
      y: 0,
    },
    size: {
      height: 200,
      width: 100,
    },
    content: {
      text: 'Hallo Welt',
      color: 'lightcyan'
    }
}

// SUMMARY: Key type system improvements for Angular preparation
//
// 1. USE READONLY: Make all interface properties readonly
//    - Enforces immutability at compile time
//    - Prevents accidental mutations
//
// 2. STRING IDS: Use string IDs instead of numbers
//    - More flexible (UUIDs, timestamps + random)
//    - Standard in modern web apps
//
// 3. SIMPLIFY INTERFACES: One clear data model, not multiple overlapping ones
//    - Easier to understand and maintain
//    - Less confusion about which interface to use
//
// 4. FREEZE CONSTANTS: Use Object.freeze() or 'as const'
//    - Prevents mutations of shared objects
//    - Safer code
//
// 5. DOCUMENT TYPES: Add JSDoc comments
//    - Better IDE support
//    - Team collaboration
//
// 6. SEPARATE CONCERNS: Keep UI styling out of state
//    - Colors belong in CSS
//    - State should only contain business logic data
//
// These patterns are essential for Angular development where:
// - Type safety prevents runtime errors
// - Immutability enables change detection
// - Clear interfaces improve code maintainability