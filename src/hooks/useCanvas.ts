import { useCallback, useRef, useState } from "react";
import { DrawingData, Point, ShapeData, Tool } from "@/types";
import { Socket } from "socket.io-client";

export const useCanvas = (socket: Socket | null) => {
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
      context.strokeStyle = shapeColor;
      context.lineWidth = shapeSize;
      context.beginPath();

      if (type === "rectangle") {
        const width = endPoint.x - startPoint.x;
        const height = endPoint.y - startPoint.y;
        context.strokeRect(startPoint.x, startPoint.y, width, height);
      } else {
        const radius = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) +
            Math.pow(endPoint.y - startPoint.y, 2)
        );
        context.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        context.stroke();
      }
    },
    []
  );

  const handleDraw = useCallback(
    (
      canvas: HTMLCanvasElement,
      point: Point,
      isNewStroke: boolean = false
    ) => {
      const context = canvas.getContext("2d");
      if (!context) return;

      if (isNewStroke) {
        context.beginPath();
        context.moveTo(point.x, point.y);
      } else {
        context.strokeStyle = selectedTool === "eraser" ? "#FFFFFF" : color;
        context.lineWidth = selectedTool === "eraser" ? brushSize * 2 : brushSize;
        context.lineCap = "round";
        context.lineTo(point.x, point.y);
        context.stroke();
      }

      const drawingData: DrawingData = {
        x: point.x,
        y: point.y,
        color: selectedTool === "eraser" ? "#FFFFFF" : color,
        size: selectedTool === "eraser" ? brushSize * 2 : brushSize,
        type: isNewStroke ? "start" : "draw",
        tool: selectedTool,
      };

      socket?.emit("draw", drawingData);
    },
    [selectedTool, color, brushSize, socket]
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
    handleDraw,
  };
};
