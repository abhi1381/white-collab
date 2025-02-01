import { useCallback, useRef, useState } from "react";
import { Point, ShapeData, Tool } from "@/types";

export const useCanvas = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [selectedTool, setSelectedTool] = useState<Tool>("pen");
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const lastPoint = useRef<Point | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const drawShape = useCallback(
    (
      context: CanvasRenderingContext2D,
      shapeData: ShapeData,
      shapeColor: string,
      shapeSize: number
    ) => {
      const { startPoint, endPoint, type } = shapeData;

      if (context.canvas !== document.querySelector("canvas")) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      }

      context.strokeStyle = shapeColor;
      context.lineWidth = shapeSize;
      context.beginPath();

      if (type === "rectangle") {
        const width = endPoint.x - startPoint.x;
        const height = endPoint.y - startPoint.y;
        context.strokeRect(startPoint.x, startPoint.y, width, height);
      } else if (type === "circle") {
        const radius = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) +
            Math.pow(endPoint.y - startPoint.y, 2)
        );
        context.beginPath();
        context.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        context.stroke();
      }
    },
    []
  );

  return {
    isDrawing,
    setIsDrawing,
    color,
    setColor,
    brushSize,
    setBrushSize,
    selectedTool,
    setSelectedTool,
    startPoint,
    setStartPoint,
    lastPoint,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    drawShape,
  };
};
