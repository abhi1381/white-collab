"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import throttle from "lodash/throttle";
import debounce from "lodash/debounce";

interface User {
  id: string;
  name: string;
  emoji: string;
  position: Point;
  isDrawing?: boolean;
}

interface DrawingData {
  x: number;
  y: number;
  color: string;
  size: number;
  type: "start" | "draw" | "end";
  tool?: "pen" | "eraser" | "rectangle" | "circle";
  layerId?: number;
  shapeData?: {
    startPoint: Point;
    endPoint: Point;
    type: "rectangle" | "circle";
  };
  user?: {
    id: string;
    name: string;
    emoji: string;
  };
}

interface Point {
  x: number;
  y: number;
}

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const socketRef = useRef<Socket | null>(null);
  const [selectedTool, setSelectedTool] = useState<
    "pen" | "eraser" | "rectangle" | "circle"
  >("pen");
  const [presetColors] = useState([
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFFFFF",
  ]);
  const [layers, setLayers] = useState([
    { id: 1, visible: true, name: "Layer 1" },
  ]);
  const [activeLayer, setActiveLayer] = useState(1);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    emoji: string;
  }>({
    name: "",
    emoji: "",
  });
  const lastPoint = useRef<Point | null>(null);

  const drawQueue = useRef<DrawingData[]>([]);
  const isAnimationFrameScheduled = useRef(false);
  const lastEmitTime = useRef(0);

  const generateRandomName = () => {
    const adjectives = ["Happy", "Lucky", "Sunny", "Clever", "Swift", "Bright"];
    const nouns = ["Panda", "Fox", "Owl", "Tiger", "Bear", "Wolf"];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
      nouns[Math.floor(Math.random() * nouns.length)]
    }`;
  };

  const generateRandomEmoji = () => {
    const emojis = ["🎨", "✏️", "🖌️", "🖍️", "🎭", "🎪", "🌈", "⭐"];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  const processDrawQueue = useCallback(() => {
    if (!canvasRef.current || drawQueue.current.length === 0) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    while (drawQueue.current.length > 0) {
      const data = drawQueue.current.shift();
      if (!data) continue;

      if (data.shapeData) {
        const { startPoint, endPoint, type } = data.shapeData;
        drawShape(context, startPoint, endPoint, type, data.color, data.size);
      } else if (data.type === "start") {
        context.beginPath();
        context.moveTo(data.x, data.y);
      } else if (data.type === "draw") {
        context.lineTo(data.x, data.y);
        context.strokeStyle = data.color;
        context.lineWidth = data.size;
        context.lineCap = "round";
        context.stroke();
      }
    }

    isAnimationFrameScheduled.current = false;
  }, []);

  const handleDrawEvent = useCallback(
    (data: DrawingData) => {
      drawQueue.current.push(data);

      if (!isAnimationFrameScheduled.current) {
        isAnimationFrameScheduled.current = true;
        requestAnimationFrame(processDrawQueue);
      }
    },
    [processDrawQueue]
  );

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    const name = generateRandomName();
    const emoji = generateRandomEmoji();
    setCurrentUser({ name, emoji });

    const initializeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext("2d");
        if (context) {
          context.fillStyle = "white";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    initializeCanvas();

    const initializeTempCanvas = () => {
      const tempCanvas = tempCanvasRef.current;
      if (tempCanvas) {
        tempCanvas.style.position = "absolute";
        tempCanvas.style.pointerEvents = "none";
        tempCanvas.style.top = "0";
        tempCanvas.style.left = "0";
      }
    };

    initializeTempCanvas();

    socket.emit("user-joined", { name, emoji });

    const debouncedUsersUpdate = debounce((users: User[]) => {
      setActiveUsers(users);
    }, 100);

    socket.on("users-update", debouncedUsersUpdate);

    socket.on("draw", handleDrawEvent);

    socket.on("user-position", (data: { id: string; position: Point }) => {
      setActiveUsers((prevUsers) => {
        const userIndex = prevUsers.findIndex((u) => u.id === data.id);
        if (userIndex === -1) return prevUsers;

        const newUsers = [...prevUsers];
        newUsers[userIndex] = {
          ...newUsers[userIndex],
          position: data.position,
        };
        return newUsers;
      });
    });

    socket.on("user-disconnected", (userId: string) => {
      setActiveUsers((users) => users.filter((u) => u.id !== userId));
    });

    const loadSavedState = () => {
      const savedState = localStorage.getItem("canvasState");
      if (savedState && canvasRef.current) {
        const img = new Image();
        img.src = savedState;
        img.onload = () => {
          const context = canvasRef.current?.getContext("2d");
          if (context && canvasRef.current) {
            context.drawImage(img, 0, 0);
          }
        };
      }
    };

    loadSavedState();

    return () => {
      socket.off("draw", handleDrawEvent);
      socket.off("users-update", debouncedUsersUpdate);
      socket.disconnect();
    };
  }, [handleDrawEvent]);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      localStorage.setItem("canvasState", dataUrl);
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), dataUrl]);
      setHistoryIndex((prev) => prev + 1);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (context && canvas) {
        const img = new Image();
        img.src = history[historyIndex - 1];
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0);
        };
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (context && canvas) {
        const img = new Image();
        img.src = history[historyIndex + 1];
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0);
        };
      }
    }
  };

  const handlePaste = async (
    e: React.ClipboardEvent<HTMLCanvasElement>
  ): Promise<void> => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = canvasRef.current;
            const context = canvas?.getContext("2d");
            if (context && canvas) {
              context.drawImage(img, 0, 0);
              saveCanvasState();
            }
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "whiteboard.png";
      link.href = dataUrl;
      link.click();
    }
  };

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Start new path locally
    context.beginPath();
    context.moveTo(x, y);

    // Emit to other users
    socketRef.current?.emit("draw", {
      x,
      y,
      color,
      size: brushSize,
      type: "start",
      user: currentUser,
    });

    setStartPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const drawShape = (
    context: CanvasRenderingContext2D,
    start: Point,
    end: Point,
    type: "rectangle" | "circle",
    shapeColor: string,
    shapeSize: number,
    isPreview = false
  ) => {
    const canvas = isPreview ? tempCanvasRef.current : canvasRef.current;
    if (!canvas) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.strokeStyle = shapeColor;
    context.lineWidth = shapeSize;

    if (type === "rectangle") {
      const width = end.x - start.x;
      const height = end.y - start.y;
      context.strokeRect(start.x, start.y, width, height);
    } else if (type === "circle") {
      const radius = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      context.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      context.stroke();
    }
  };

  const emitCursorPosition = useMemo(
    () =>
      throttle((position: Point) => {
        socketRef.current?.emit("user-position", { position });
      }, 50), // Throttle to 50ms
    []
  );

  const draw = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !canvasRef.current || !tempCanvasRef.current) return;

      const canvas = canvasRef.current;
      const tempCanvas = tempCanvasRef.current;
      const context = canvas.getContext("2d");
      const tempContext = tempCanvas.getContext("2d");

      if (!context || !tempContext) return;

      const rect = canvas.getBoundingClientRect();
      const currentPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Throttle cursor position updates
      emitCursorPosition(currentPoint);

      // Throttle drawing events
      const now = Date.now();
      if (now - lastEmitTime.current < 16) return; // Limit to ~60fps
      lastEmitTime.current = now;

      if (selectedTool === "rectangle" || selectedTool === "circle") {
        if (startPoint) {
          drawShape(
            tempContext,
            startPoint,
            currentPoint,
            selectedTool,
            color,
            brushSize,
            true
          );

          socketRef.current?.emit("draw", {
            color,
            size: brushSize,
            type: "draw",
            tool: selectedTool,
            shapeData: {
              startPoint,
              endPoint: currentPoint,
              type: selectedTool,
            },
          });
        }
      } else {
        context.strokeStyle = selectedTool === "eraser" ? "#FFFFFF" : color;
        context.lineWidth =
          selectedTool === "eraser" ? brushSize * 2 : brushSize;
        context.lineCap = "round";
        context.lineTo(currentPoint.x, currentPoint.y);
        context.stroke();

        socketRef.current?.emit("draw", {
          x: currentPoint.x,
          y: currentPoint.y,
          color: selectedTool === "eraser" ? "#FFFFFF" : color,
          size: selectedTool === "eraser" ? brushSize * 2 : brushSize,
          type: "draw",
          tool: selectedTool,
        });
      }

      lastPoint.current = currentPoint;
    },
    [isDrawing, selectedTool, color, brushSize, startPoint, emitCursorPosition]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    if (
      startPoint &&
      (selectedTool === "rectangle" || selectedTool === "circle")
    ) {
      const canvas = canvasRef.current;
      const tempCanvas = tempCanvasRef.current;
      if (canvas && tempCanvas) {
        requestAnimationFrame(() => {
          const context = canvas.getContext("2d");
          if (context) {
            context.drawImage(tempCanvas, 0, 0);
            const tempContext = tempCanvas.getContext("2d");
            if (tempContext) {
              tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            }
          }
          saveCanvasState();
        });
      }
    }
    setIsDrawing(false);
    setStartPoint(null);
  }, [isDrawing, startPoint, selectedTool]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const resizeObserver = new ResizeObserver(
      throttle(() => {
        if (canvasRef.current && tempCanvasRef.current) {
          const canvas = canvasRef.current;
          const tempCanvas = tempCanvasRef.current;
          canvas.width = window.innerWidth - 300;
          canvas.height = window.innerHeight - 50;
          tempCanvas.width = window.innerWidth - 300;
          tempCanvas.height = window.innerHeight - 50;
        }
      }, 100)
    );

    resizeObserver.observe(canvasRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    if (!canvas || !tempCanvas) return;

    const context = canvas.getContext("2d");
    const tempContext = tempCanvas.getContext("2d");

    if (context && tempContext) {
      // Clear both canvases
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Clear localStorage
      localStorage.removeItem("canvasState");

      // Reset history
      setHistory([]);
      setHistoryIndex(-1);

      socketRef.current?.emit("clear");
    }
  };

  return (
    <div className="flex gap-4 h-screen p-4">
      {/* Left Vertical Toolbar */}
      <div className="flex flex-col gap-6 bg-gray-100 p-4 rounded-lg shadow-md min-w-[200px]">
        <div className="space-y-4">
          {/* User Info */}
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-600">
              {currentUser.emoji} You: {currentUser.name}
            </div>
            <div className="text-sm text-gray-600">
              Active Users: {activeUsers.length}
            </div>
          </div>

          {/* Active Users */}
          <div className="flex flex-col gap-2">
            {activeUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                  user.isDrawing ? "bg-blue-100 text-blue-800" : "bg-gray-100"
                }`}
              >
                <span>{user.emoji}</span>
                <span>{user.name}</span>
                {user.isDrawing && (
                  <span className="animate-pulse text-blue-600">✍️</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            {["pen", "eraser", "rectangle", "circle"].map((tool) => (
              <button
                key={tool}
                onClick={() => setSelectedTool(tool as never)}
                className={`p-2 rounded transition-all duration-200 ${
                  selectedTool === tool
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700"
                }`}
              >
                {tool.charAt(0).toUpperCase() + tool.slice(1)}
              </button>
            ))}
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Color</label>
            <div className="grid grid-cols-4 gap-1">
              {presetColors.map((presetColor) => (
                <button
                  title="Select color"
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                    color === presetColor
                      ? "border-blue-500 scale-110 shadow-sm"
                      : "border-gray-300 opacity-60 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
            <input
              title="Select color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Brush Size */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Size</label>
            <input
              title="Select brush size"
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={clearCanvas}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="flex-1 px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-30"
            >
              Undo
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="flex-1 px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-30"
            >
              Redo
            </button>
          </div>
          <button
            onClick={downloadCanvas}
            className="w-full px-3 py-1 bg-green-500 text-white rounded"
          >
            Download
          </button>
        </div>

        {/* Layers */}
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Layers</label>
          <div className="flex flex-col gap-2">
            {layers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                className={`px-2 py-1 rounded transition-all duration-200 ${
                  activeLayer === layer.id
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-white text-gray-500 hover:text-gray-700"
                }`}
              >
                {layer.name}
              </button>
            ))}
            <button
              onClick={() =>
                setLayers((l) => [
                  ...l,
                  {
                    id: l.length + 1,
                    visible: true,
                    name: `Layer ${l.length + 1}`,
                  },
                ])
              }
              className="px-2 py-1 bg-gray-500 text-white rounded"
            >
              + Layer
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          width={window.innerWidth - 300}
          height={window.innerHeight - 50}
          className="border border-gray-300 bg-white rounded-lg shadow-lg"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onPaste={handlePaste}
        />
        <canvas
          ref={tempCanvasRef}
          width={window.innerWidth - 300}
          height={window.innerHeight - 50}
          className="pointer-events-none absolute top-0 left-0"
        />
        {/* User cursors */}
        {activeUsers.map((user) => (
          <div
            key={user.id}
            className="absolute transform -translate-x-2 -translate-y-2"
            style={{
              left: user.position.x,
              top: user.position.y,
            }}
          >
            <div
              className={`w-4 h-4 rounded-full ${
                user.isDrawing ? "bg-blue-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            <div className="absolute top-5 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {user.emoji} {user.name}
              {user.isDrawing && (
                <span className="ml-1 animate-pulse">drawing...</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
