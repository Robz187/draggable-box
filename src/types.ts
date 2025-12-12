export interface Position {
  x: number;
  y: number;
}
export interface Size {
  width: number;
  height: number;
}
export interface BoxConfig {
  header:{ title: string;  color: string; };
  start: Position;
  size: Size;
  content: { text: string; color: string; };
}

export interface BoxState {
  id: number;
  position: Position;
  size: Size;
  zIndex: number;
  dragging: boolean;
  color: string;
}

export interface CreateBoxOptions extends Partial<BoxState>{
  config?: BoxConfig;
}