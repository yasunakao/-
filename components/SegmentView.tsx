
import React, { useRef, useState, useEffect } from 'react';
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
  
  // Larger ROI size for easier touch control
  const ROI_SIZE = 60;
  const [roi, setRoi] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Initial centering after a short delay to ensure layout is ready
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setRoi({ 
          x: (width / 2) - (ROI_SIZE / 2), 
          y: (height / 2) - (ROI_SIZE / 2) 
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e); // Immediately move to touch point
  };
  
  const handleEnd = () => setIsDragging(false);

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : e;
    
    // Position selector center at touch point
    let x = touch.clientX - rect.left - ROI_SIZE / 2;
    let y = touch.clientY - rect.top - ROI_SIZE / 2;
    
    // Stay within container bounds
    x = Math.max(0, Math.min(x, rect.width - ROI_SIZE));
    y = Math.max(0, Math.min(y, rect.height - ROI_SIZE));
    
    setRoi({ x, y });
  };

  const processAnalysis = () => {
    if (!imgRef.current || !canvasRef.current) return;

    const img = imgRef.current;
    const canvas = canvasRef.current;
    
    // Important: Calculate the actual rendered dimensions of the image within object-contain
    const containerWidth = img.clientWidth;
    const containerHeight = img.clientHeight;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = containerWidth / containerHeight;

    let renderWidth, renderHeight, offsetX = 0, offsetY = 0;

    if (imgAspect > containerAspect) {
      renderWidth = containerWidth;
      renderHeight = containerWidth / imgAspect;
      offsetY = (containerHeight - renderHeight) / 2;
    } else {
      renderHeight = containerHeight;
      renderWidth = containerHeight * imgAspect;
      offsetX = (containerWidth - renderWidth) / 2;
    }

    // Adjust ROI coordinates relative to the actual image area
    const relativeX = (roi.x - offsetX);
    const relativeY = (roi.y - offsetY);
    
    const scale = img.naturalWidth / renderWidth;

    const sourceX = relativeX * scale;
    const sourceY = relativeY * scale;
    const sourceSize = ROI_SIZE * scale;

    canvas.width = sourceSize;
    canvas.height = sourceSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (ctx) {
      // Clear and draw just the cropped part
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    <div className="h-full flex flex-col bg-gray-950 overflow-hidden">
      <div className="p-4 bg-gray-900 text-white text-xs text-center font-bold tracking-tight">
        白目（強膜）の白い部分に黄色の枠を合わせてください
      </div>

      <div 
        ref={containerRef}
        className="relative flex-1 overflow-hidden touch-none flex items-center justify-center bg-black"
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
          alt="Captured"
        />
        
        {/* ROI Selector */}
        <div 
          style={{
            left: roi.x,
            top: roi.y,
            width: ROI_SIZE,
            height: ROI_SIZE,
          }}
          className="absolute border-2 border-yellow-400 bg-yellow-400/20 shadow-[0_0_0_2000px_rgba(0,0,0,0.6)] pointer-events-none rounded-sm flex items-center justify-center"
        >
          <div className="w-full h-full border border-white/30 flex items-center justify-center">
            <Move className="text-yellow-400 w-6 h-6 drop-shadow-md" />
          </div>
        </div>
      </div>

      <div className="p-6 pb-10 bg-white flex gap-4 border-t border-gray-100">
        <button 
          onClick={onCancel}
          className="flex-1 border border-gray-200 py-4 rounded-xl font-bold text-gray-600 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" /> 戻る
        </button>
        <button 
          onClick={processAnalysis}
          className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
        >
          <Check className="w-5 h-5" /> 解析を実行
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default SegmentView;
