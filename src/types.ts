export interface Position {
  x: number;
  y: number;
}
export interface Size {
  width: number;
  height: number;
}
export interface BoxConfig {
  header: { title: string; color: string; };
  start: Position;
  size: Size;
  content: { text: string; color: string; };
}

export interface BoxState {
  id: number;
  position: Position;
  size: Size;
  zIndex: number;
  color: string;
}

export interface CreateBoxOptions extends Partial<BoxState> {
  config?: BoxConfig;
}

export const DEFAULT_CONFIG: BoxConfig = {
    header: {
      title: 'Klick mich',
      color: 'lightgrey'
    },
    start: {
      x: 100,
      y: 100,
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