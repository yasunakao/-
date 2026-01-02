
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Check, X, Move } from 'lucide-react';
import { AnalysisResult, JaundiceCategory } from '../types';
import { calculateMedianBChannel } from '../services/colorAnalysis';
import { B_CHANNEL_THRESHOLD } from '../constants';

interface Props {
  imageUrl: string;
  onComplete: (result: AnalysisResult) => void;
  onCancel: () => void;
}

const SegmentView: React.FC<Props> = ({ imageUrl, onComplete, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // UI scaling: ROI size (64x64 is a good size for eyes)
  const ROI_SIZE = 64; 
  const [roi, setRoi] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Center ROI on load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setRoi({ 
          x: (width / 2) - (ROI_SIZE / 2), 
          y: (height / 2) - (ROI_SIZE / 2) 
        });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const updatePosition = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    
    // Position the center of the ROI box at the touch/click point
    let x = touch.clientX - rect.left - ROI_SIZE / 2;
    let y = touch.clientY - rect.top - ROI_SIZE / 2;
    
    // Boundary constraints to keep ROI inside the viewable area
    x = Math.max(0, Math.min(x, rect.width - ROI_SIZE));
    y = Math.max(0, Math.min(y, rect.height - ROI_SIZE));
    
    setRoi({ x, y });
  }, []);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    updatePosition(e);
  };
  
  const handleEnd = () => setIsDragging(false);

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    updatePosition(e);
  };

  const processAnalysis = () => {
    if (!imgRef.current || !canvasRef.current) return;

    const img = imgRef.current;
    const canvas = canvasRef.current;
    
    // Handle object-contain image scaling logic
    const containerWidth = img.clientWidth;
    const containerHeight = img.clientHeight;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const imgAspect = naturalWidth / naturalHeight;
    const containerAspect = containerWidth / containerHeight;

    let displayedWidth, displayedHeight, offsetX = 0, offsetY = 0;

    if (imgAspect > containerAspect) {
      displayedWidth = containerWidth;
      displayedHeight = containerWidth / imgAspect;
      offsetY = (containerHeight - displayedHeight) / 2;
    } else {
      displayedHeight = containerHeight;
      displayedWidth = containerHeight * imgAspect;
      offsetX = (containerWidth - displayedWidth) / 2;
    }

    // Convert UI coordinates to natural image coordinates
    const relativeX = (roi.x - offsetX);
    const relativeY = (roi.y - offsetY);
    const scale = naturalWidth / displayedWidth;

    const sourceX = Math.max(0, relativeX * scale);
    const sourceY = Math.max(0, relativeY * scale);
    const sourceSize = ROI_SIZE * scale;

    canvas.width = sourceSize;
    canvas.height = sourceSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (ctx) {
      ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, sourceSize, sourceSize);
      
      const bValue = calculateMedianBChannel(ctx, sourceSize, sourceSize);
      
      let category = JaundiceCategory.NORMAL;
      if (bValue >= 138) category = JaundiceCategory.OVERT;
      else if (bValue >= B_CHANNEL_THRESHOLD) category = JaundiceCategory.SUBCLINICAL;

      onComplete({
        bValue,
        prediction: category,
        timestamp: Date.now(),
        imageUrl
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden h-full">
      <div className="p-3 bg-gray-900 text-white text-[10px] text-center font-bold tracking-widest uppercase">
        画面をタッチして、白目の白い部分に枠を合わせてください
      </div>

      <div 
        ref={containerRef}
        className="relative flex-1 overflow-hidden touch-none flex items-center justify-center bg-black cursor-crosshair"
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <img 
          ref={imgRef}
          src={imageUrl} 
          className="w-full h-full object-contain pointer-events-none select-none"
          alt="Target"
        />
        
        {/* Shadow Overlay around ROI to highlight selection */}
        <div 
          style={{
            left: roi.x,
            top: roi.y,
            width: ROI_SIZE,
            height: ROI_SIZE,
          }}
          className="absolute border-2 border-yellow-400 bg-yellow-400/10 shadow-[0_0_0_2000px_rgba(0,0,0,0.6)] rounded-sm pointer-events-none flex items-center justify-center"
        >
          <Move className="text-yellow-400 w-6 h-6 drop-shadow-lg opacity-90 animate-pulse" />
        </div>
      </div>

      <div className="p-6 pb-12 bg-white flex gap-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={onCancel}
          className="flex-1 border border-gray-200 py-4 rounded-2xl font-bold text-gray-500 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" /> 撮り直す
        </button>
        <button 
          onClick={processAnalysis}
          className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          <Check className="w-5 h-5" /> 解析を実行
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default SegmentView;
