export interface Point {
  x: number;
  y: number;
}

export interface User {
  id: string;
  name: string;
  emoji: string;
  position: Point;
  isDrawing?: boolean;
}

export interface ShapeData {
  startPoint: Point;
  endPoint: Point;
  type: "rectangle" | "circle";
}

export interface ImageData {
  dataUrl: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DrawingData {
  x: number;
  y: number;
  color: string;
  size: number;
  type: "start" | "draw" | "end";
  tool?: "pen" | "eraser" | "rectangle" | "circle";
  layerId?: number;
  shapeData?: ShapeData;
  user?: User;
  imageData?: ImageData;
}

export type Tool = "pen" | "eraser" | "rectangle" | "circle";
