
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
  
  // Square ROI for sclera extraction
  const [roi, setRoi] = useState({ x: 100, y: 100, size: 40 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Initial centering
    if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setRoi({ x: width / 2 - 20, y: height / 2 - 20, size: 40 });
    }
  }, []);

  const handleTouchStart = () => setIsDragging(true);
  const handleTouchEnd = () => setIsDragging(false);

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : e;
    
    const x = touch.clientX - rect.left - roi.size / 2;
    const y = touch.clientY - rect.top - roi.size / 2;
    
    // Bounds check
    const newX = Math.max(0, Math.min(x, rect.width - roi.size));
    const newY = Math.max(0, Math.min(y, rect.height - roi.size));
    
    setRoi(prev => ({ ...prev, x: newX, y: newY }));
  };

  const processAnalysis = () => {
    if (!imgRef.current || !canvasRef.current) return;

    const img = imgRef.current;
    const canvas = canvasRef.current;
    
    // Get natural scaling
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const sourceX = roi.x * scaleX;
    const sourceY = roi.y * scaleY;
    const sourceW = roi.size * scaleX;
    const sourceH = roi.size * scaleY;

    canvas.width = sourceW;
    canvas.height = sourceH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (ctx) {
      ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);
      const bValue = calculateMedianBChannel(ctx, sourceW, sourceH);
      
      let category = JaundiceCategory.NORMAL;
      if (bValue >= 138) category = JaundiceCategory.OVERT; // Higher threshold for overt
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
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 bg-gray-800 text-white text-sm text-center font-medium">
        白目（強膜）の白い部分を選択してください
      </div>

      <div 
        ref={containerRef}
        className="relative flex-1 overflow-hidden touch-none"
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          ref={imgRef}
          src={imageUrl} 
          className="w-full h-full object-contain pointer-events-none"
          alt="Captured"
        />
        
        {/* ROI Selector */}
        <div 
          onMouseDown={handleTouchStart}
          onTouchStart={handleTouchStart}
          style={{
            left: roi.x,
            top: roi.y,
            width: roi.size,
            height: roi.size,
          }}
          className="absolute border-2 border-yellow-400 bg-yellow-400/20 shadow-[0_0_0_1000px_rgba(0,0,0,0.5)] cursor-move flex items-center justify-center rounded-sm"
        >
          <Move className="text-yellow-400 w-6 h-6" />
        </div>
      </div>

      <div className="p-6 bg-white flex gap-4">
        <button 
          onClick={onCancel}
          className="flex-1 border border-gray-200 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" /> 撮り直す
        </button>
        <button 
          onClick={processAnalysis}
          className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          <Check className="w-5 h-5" /> 解析する
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default SegmentView;
