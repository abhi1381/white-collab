"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import throttle from "lodash/throttle";
import debounce from "lodash/debounce";
import { User, Point, DrawingData } from "@/types";
import { useCanvas } from "@/hooks/useCanvas";
import { Toolbar } from "./Toolbar";

// Add missing refs and state
export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    emoji: string;
  }>({
    name: "",
    emoji: "",
  });

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

  const drawQueue = useRef<DrawingData[]>([]);
  const isAnimationFrameScheduled = useRef(false);
  const lastEmitTime = useRef(0);

  const {
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
  } = useCanvas(socketRef.current);

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
        drawShape(context, data.shapeData, data.color, data.size);
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
  }, [drawShape]);

  const handleDrawEvent = useCallback(
    (data: DrawingData) => {
      // Clear any existing shapes in the temp canvas for received shape data
      if (data.shapeData && tempCanvasRef.current) {
        const tempContext = tempCanvasRef.current.getContext('2d');
        if (tempContext) {
          tempContext.clearRect(0, 0, tempCanvasRef.current.width, tempCanvasRef.current.height);
        }
      }
      
      drawQueue.current.push(data);

      if (!isAnimationFrameScheduled.current) {
        isAnimationFrameScheduled.current = true;
        requestAnimationFrame(processDrawQueue);
      }
    },
    [processDrawQueue]
  );

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "");
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

    socket.on("draw", (data: DrawingData) => {
      // Update user drawing state
      if (data.user) {
        setActiveUsers((prev) =>
          prev.map((u) => ({
            ...u,
            isDrawing:
              u.id === data.user?.id
                ? data.type === "start" || data.type === "draw"
                : u.isDrawing,
          }))
        );
      }

      // Rest of draw event handling
      handleDrawEvent(data);
    });

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

  useEffect(() => {
    const updateCanvasSize = () => {
      if (typeof window !== "undefined") {
        setCanvasSize({
          width: window.innerWidth - 300,
          height: window.innerHeight - 50,
        });
      }
    };

    // Initial size
    updateCanvasSize();

    // Add resize listener
    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateCanvasSize);
      return () => window.removeEventListener("resize", updateCanvasSize);
    }
  }, []);

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

    context.beginPath();
    context.moveTo(x, y);

    // Emit drawing state along with start event
    socketRef.current?.emit("draw", {
      x,
      y,
      color,
      size: brushSize,
      type: "start",
      user: {
        ...currentUser,
        isDrawing: true,
      },
    });

    setStartPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
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

      emitCursorPosition(currentPoint);

      const now = Date.now();
      if (now - lastEmitTime.current < 16) return;
      lastEmitTime.current = now;

      if (selectedTool === "rectangle" || selectedTool === "circle") {
        if (startPoint) {
          // Clear the temp canvas before drawing new shape
          tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          
          drawShape(
            tempContext,
            {
              startPoint,
              endPoint: currentPoint,
              type: selectedTool
            },
            color,
            brushSize
          );
          
          // Don't emit shape data during drawing, only on mouse up
        }
      } else {
        // ...existing pen/eraser drawing code...
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
    [isDrawing, selectedTool, color, brushSize, startPoint, emitCursorPosition, drawShape]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    if (startPoint && lastPoint.current && 
       (selectedTool === "rectangle" || selectedTool === "circle")) {
      const canvas = canvasRef.current;
      const tempCanvas = tempCanvasRef.current;
      if (canvas && tempCanvas) {
        // Emit the final shape data only once when stopping
        socketRef.current?.emit("draw", {
          color,
          size: brushSize,
          type: "shape",
          tool: selectedTool,
          shapeData: {
            startPoint,
            endPoint: lastPoint.current,
            type: selectedTool,
          },
        });

        // Draw the final shape on the main canvas
        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(tempCanvas, 0, 0);
          const tempContext = tempCanvas.getContext("2d");
          if (tempContext) {
            tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          }
          saveCanvasState();
        }
      }
    }

    // Emit drawing end state
    socketRef.current?.emit("draw", {
      type: "end",
      user: {
        ...currentUser,
        isDrawing: false,
      },
    });

    setIsDrawing(false);
    setStartPoint(null);
  }, [isDrawing, startPoint, selectedTool, color, brushSize, currentUser, saveCanvasState]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const resizeObserver = new ResizeObserver(
      throttle(() => {
        if (canvasRef.current && tempCanvasRef.current) {
          const canvas = canvasRef.current;
          const tempCanvas = tempCanvasRef.current;
          canvas.width = canvasSize.width;
          canvas.height = canvasSize.height;
          tempCanvas.width = canvasSize.width;
          tempCanvas.height = canvasSize.height;
        }
      }, 100)
    );

    resizeObserver.observe(canvasRef.current);
    return () => resizeObserver.disconnect();
  }, [canvasSize]);

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
      <Toolbar
        currentUser={currentUser}
        activeUsers={activeUsers}
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        presetColors={presetColors}
        onClear={clearCanvas}
        onUndo={undo}
        onRedo={redo}
        onDownload={downloadCanvas}
        historyIndex={historyIndex}
        historyLength={history.length}
      />

      {/* Canvas Area */}
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border border-gray-300 bg-white rounded-lg shadow-lg"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onPaste={handlePaste}
        />
        <canvas
          ref={tempCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="pointer-events-none absolute top-0 left-0"
        />
        {/* User cursors */}
        {activeUsers.map((user) => (
          <div
            key={user.id}
            className="absolute transform -translate-x-2 -translate-y-2"
            style={{ left: user.position.x, top: user.position.y }}
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
