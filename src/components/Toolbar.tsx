import { Tool, User } from '@/types';

interface ToolbarProps {
  currentUser: { name: string; emoji: string };
  activeUsers: User[];
  selectedTool: Tool;
  setSelectedTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  presetColors: string[];
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
  historyIndex: number;
  historyLength: number;
  isMobileView?: boolean;
}

export function Toolbar({
  currentUser,
  activeUsers,
  selectedTool,
  setSelectedTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  presetColors,
  onClear,
  onUndo,
  onRedo,
  onDownload,
  historyIndex,
  historyLength,
  isMobileView = false,
}: ToolbarProps) {
  return (
    <div className={`
      flex flex-col gap-6 bg-gray-100 p-4 rounded-lg shadow-md
      ${isMobileView 
        ? 'min-w-[280px] max-w-[95vw] max-h-[80vh] overflow-y-auto'
        : 'min-w-[200px] max-h-screen overflow-y-auto'
      }
    `}>
      <div className={`space-y-4 ${isMobileView ? 'hidden md:block' : ''}`}>
        <div className="bg-white p-2 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-600">
            {currentUser.emoji} You: {currentUser.name}
          </div>
          <div className="text-sm text-gray-600">
            Active Users: {activeUsers.length}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {activeUsers.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm text-black/80 ${
                user.isDrawing
                  ? "bg-blue-100 text-blue-800 border-2 border-blue-400"
                  : "bg-gray-100"
              }`}
            >
              <span>{user.emoji}</span>
              <span>{user.name}</span>
              {user.isDrawing && (
                <span className="animate-pulse text-blue-600 ml-1">✍️</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className={`
          ${isMobileView ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}
        `}>
          {["pen", "eraser", "rectangle", "circle"].map((tool) => (
            <button
              key={tool}
              onClick={() => setSelectedTool(tool as Tool)}
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

        <div className="space-y-2">
          <label className="text-sm text-gray-600">Color</label>
          <div className={`
            grid gap-1
            ${isMobileView ? 'grid-cols-8' : 'grid-cols-4'}
          `}>
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

      <div className={`
        space-y-2 
        ${isMobileView ? 'sticky bottom-0 bg-gray-100 pt-2' : 'sticky bottom-4 bg-gray-100 pt-4'}
      `}>
        <button
          onClick={onClear}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear
        </button>
        <div className="flex gap-2">
          <button
            onClick={onUndo}
            disabled={historyIndex <= 0}
            className="flex-1 px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-30"
          >
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={historyIndex >= historyLength - 1}
            className="flex-1 px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-30"
          >
            Redo
          </button>
        </div>
        <button
          onClick={onDownload}
          className="w-full px-3 py-1 bg-green-500 text-white rounded"
        >
          Download
        </button>
      </div>
    </div>
  );
}
