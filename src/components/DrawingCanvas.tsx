import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Trash2, Paintbrush } from 'lucide-react';

interface DrawingCanvasProps {
  onCapture: (base64Image: string) => void;
  width?: number;
  height?: number;
}

export default function DrawingCanvas({ onCapture, width = 280, height = 280 }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(8);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Fill white background on load
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling while drawing on mobile
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = lineWidth;
    
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleCapture = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const base64Image = canvas.toDataURL('image/png');
      onCapture(base64Image);
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-xl p-4">
      {/* Canvas Elements */}
      <canvas
        id="drawing-canvas-element"
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="border border-gray-300 rounded-lg bg-white shadow-inner cursor-crosshair touch-none"
      />

      {/* Toolbox */}
      <div className="flex flex-wrap items-center justify-between w-full mt-4 gap-2 border-t border-gray-200 pt-3">
        {/* Tool selector */}
        <div className="flex items-center gap-1 bg-gray-200/60 p-1 rounded-lg">
          <button
            type="button"
            id="tool-pen-btn"
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-md transition-colors ${
              tool === 'pen' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Brush"
          >
            <Paintbrush className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="tool-eraser-btn"
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-md transition-colors ${
              tool === 'eraser' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Colors */}
        {tool === 'pen' && (
          <div className="flex items-center gap-1.5">
            {['#000000', '#dc2626', '#2563eb', '#16a34a', '#d97706'].map((colorHex) => (
              <button
                key={colorHex}
                type="button"
                id={`color-${colorHex.replace('#', '')}`}
                onClick={() => setColor(colorHex)}
                style={{ backgroundColor: colorHex }}
                className={`w-5 h-5 rounded-full transition-transform ${
                  color === colorHex ? 'scale-125 ring-2 ring-emerald-500 ring-offset-1' : 'hover:scale-110'
                }`}
              />
            ))}
          </div>
        )}

        {/* Brush size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">Size</span>
          <input
            id="brush-size-slider"
            type="range"
            min="2"
            max="24"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-16 accent-emerald-600 cursor-pointer"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="canvas-clear-btn"
            onClick={clearCanvas}
            className="p-1.5 hover:bg-gray-200 text-gray-600 hover:text-red-600 rounded-lg transition-colors"
            title="Clear canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        id="add-canvas-capture-btn"
        onClick={handleCapture}
        className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 px-3 rounded-lg shadow-sm transition-colors cursor-pointer text-center"
      >
        Add Canvas Sketch
      </button>
    </div>
  );
}
