import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';

interface DrawingCanvasProps {
  onAnalyze: (imageData: string, inputGrid: number[]) => void;
  isAnalyzing: boolean;
}

const GRID_SIZE = 8; // 8x8 = 64 neurons

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onAnalyze, isAnalyzing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasContent(false);
        // Reset parent state implicitly by sending empty grid if needed, 
        // but usually handled by next analyze click
      }
    }
  }, []);

  useEffect(() => {
    clearCanvas();
  }, [clearCanvas]);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isAnalyzing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = 20; // Thicker for 8x8 grid detection
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'white';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'white';
      setIsDrawing(true);
      setHasContent(true);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isAnalyzing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      // Auto-update the visualization even without clicking analyze
      // We could add a debounce here for real-time inference look
      requestAnimationFrame(handleRealtimePreview);
    }
  };

  // Extract 8x8 grid for the neural net
  const getInputGrid = (): number[] => {
    const canvas = canvasRef.current;
    if (!canvas) return Array(GRID_SIZE * GRID_SIZE).fill(0);

    const ctx = canvas.getContext('2d');
    if (!ctx) return Array(GRID_SIZE * GRID_SIZE).fill(0);

    const inputGrid: number[] = [];
    const cellWidth = canvas.width / GRID_SIZE;
    const cellHeight = canvas.height / GRID_SIZE;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const imgData = ctx.getImageData(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        let totalBrightness = 0;
        
        // Sample pixels (step by 4 for RGBA)
        for (let i = 0; i < imgData.data.length; i += 4) {
          totalBrightness += imgData.data[i]; 
        }
        
        const numPixels = imgData.data.length / 4;
        const avgBrightness = totalBrightness / numPixels;
        
        // Normalize and sharpen contrast slightly
        const val = Math.min(1, avgBrightness / 100);
        inputGrid.push(val); 
      }
    }

    return inputGrid;
  };

  // Just sends the grid up for visualization without API call
  const handleRealtimePreview = () => {
      if(canvasRef.current && hasContent) {
          const inputGrid = getInputGrid();
          // We hook into the existing prop, but maybe we want a separate "onPreview"
          // For now, we only update when Analyze is clicked to save API calls,
          // but this function is ready for real-time local viz if we add a prop.
      }
  };

  const handleAnalyze = () => {
    if (canvasRef.current && hasContent) {
      const imageData = canvasRef.current.toDataURL('image/png');
      const inputGrid = getInputGrid();
      onAnalyze(imageData, inputGrid);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
        
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="relative bg-black rounded-lg cursor-crosshair touch-none border-2 border-slate-700"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Grid Overlay Hint (Optional, visual only) */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden opacity-10">
            {Array(64).fill(0).map((_, i) => (
                <div key={i} className="border border-white/20"></div>
            ))}
        </div>
      </div>

      <div className="flex gap-4 w-full justify-center">
        <button
          onClick={clearCanvas}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors disabled:opacity-50"
        >
          <RotateCcw size={18} /> Clear
        </button>
        <button
          onClick={handleAnalyze}
          disabled={!hasContent || isAnalyzing}
          className={`flex items-center gap-2 px-6 py-2 rounded-md font-bold transition-all ${
            hasContent && !isAnalyzing
              ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-[0_0_15px_rgba(0,243,255,0.5)] hover:shadow-[0_0_25px_rgba(0,243,255,0.7)]'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isAnalyzing ? (
            <span className="animate-pulse">Processing...</span>
          ) : (
            <>
              <CheckCircle size={18} /> Analyze
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DrawingCanvas;