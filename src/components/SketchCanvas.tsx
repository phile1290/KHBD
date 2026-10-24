import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  Eraser, 
  RotateCcw, 
  Trash2, 
  Palette, 
  Info 
} from 'lucide-react';

interface SketchCanvasProps {
  onCanvasChange: (dataUrl: string | null) => void;
}

const COLORS = [
  '#ffffff', // White
  '#000000', // Black
  '#38bdf8', // Neon Sky Blue
  '#f43f5e', // Rose Red
  '#22c55e', // Green
  '#eab308', // Yellow
  '#a855f7', // Purple
  '#f97316', // Orange
];

export const SketchCanvas: React.FC<SketchCanvasProps> = ({ onCanvasChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const historyRef = useRef<ImageData[]>([]);

  // Initialize canvas with dark background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 20) {
      historyRef.current.shift();
    }
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#0f172a' : color;
    ctx.lineWidth = isEraser ? brushSize * 4 : brushSize;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
    emitData();
  };

  const emitData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onCanvasChange(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
    saveState();
    setHasContent(false);
    onCanvasChange(null);
  };

  const handleUndo = () => {
    if (historyRef.current.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    historyRef.current.pop();
    const previous = historyRef.current[historyRef.current.length - 1];
    if (previous) {
      ctx.putImageData(previous, 0, 0);
      emitData();
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <PenTool className="w-4 h-4 text-pink-400" />
          <span>Vẽ phác thảo ý tưởng (Doodle to Art)</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Vẽ vài nét cơ bản, AI sẽ biến thành bức họa hoàn chỉnh</span>
        </div>
      </div>

      {/* Canvas Tool Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
        {/* Colors */}
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                setIsEraser(false);
              }}
              className={`w-6 h-6 rounded-full transition-transform border ${
                !isEraser && color === c ? 'scale-125 border-white ring-2 ring-indigo-500' : 'border-slate-700 hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Brush size and tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEraser(!isEraser)}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 border transition-colors ${
              isEraser
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
            title="Tẩy xóa nét vẽ"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tẩy</span>
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={historyRef.current.length <= 1}
            className="p-1.5 rounded-lg text-xs flex items-center gap-1 bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-700 hover:bg-slate-750"
            title="Hoàn tác nét vẽ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={clearCanvas}
            className="p-1.5 rounded-lg text-xs flex items-center gap-1 bg-slate-800 text-rose-300 border border-slate-700 hover:bg-rose-950/30"
            title="Xóa trắng bảng vẽ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800 text-xs text-slate-400">
            <span>Nét:</span>
            <input
              type="range"
              min="2"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
              className="w-16 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Canvas Element */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-[#0f172a] shadow-inner">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair touch-none"
        />

        {!hasContent && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-600 gap-1.5">
            <PenTool className="w-8 h-8 opacity-40" />
            <span className="text-xs">Dùng chuột hoặc ngón tay để vẽ phác thảo tại đây</span>
          </div>
        )}
      </div>
    </div>
  );
};
