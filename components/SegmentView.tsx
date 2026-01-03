import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Check, X, Target, MoveHorizontal } from 'lucide-react';
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
  
  const ROI_SIZE = 72; 
  const [roi, setRoi] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setRoi({ x: (width / 2) - (ROI_SIZE / 2), y: (height / 2) - (ROI_SIZE / 2) });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const updatePosition = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    let x = touch.clientX - rect.left - ROI_SIZE / 2;
    let y = touch.clientY - rect.top - ROI_SIZE / 2;
    x = Math.max(0, Math.min(x, rect.width - ROI_SIZE));
    y = Math.max(0, Math.min(y, rect.height - ROI_SIZE));
    setRoi({ x, y });
  }, []);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => { setIsDragging(true); updatePosition(e); };
  const handleEnd = () => setIsDragging(false);
  const handleMove = (e: React.TouchEvent | React.MouseEvent) => { if (isDragging) updatePosition(e); };

  const processAnalysis = () => {
    if (!imgRef.current || !canvasRef.current) return;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    
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

    const scale = naturalWidth / displayedWidth;
    const sourceX = (roi.x - offsetX) * scale;
    const sourceY = (roi.y - offsetY) * scale;
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
      onComplete({ bValue, prediction: category, timestamp: Date.now(), imageUrl });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden h-full">
      <div className="px-5 py-4 glass-dark text-white text-center border-b border-white/10 z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Region of Interest</p>
        <p className="text-xs font-bold">白目の最も黄色い部分に枠を合わせてください</p>
      </div>

      <div 
        ref={containerRef}
        className="relative flex-1 overflow-hidden touch-none bg-black flex items-center justify-center"
        onMouseMove={handleMove} onMouseUp={handleEnd} onTouchMove={handleMove} onTouchEnd={handleEnd} onMouseDown={handleStart} onTouchStart={handleStart}
      >
        <img ref={imgRef} src={imageUrl} className="w-full h-full object-contain pointer-events-none opacity-80" alt="Target" />
        
        {/* Dim overlay */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

        {/* High-Precision ROI Box */}
        <div 
          style={{ left: roi.x, top: roi.y, width: ROI_SIZE, height: ROI_SIZE }}
          className="absolute border-2 border-blue-400 rounded-xl shadow-[0_0_0_2000px_rgba(0,0,0,0.7),0_0_20px_rgba(59,130,246,0.5)] pointer-events-none flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-20">
            <div className="border-r border-b border-white"></div>
            <div className="border-b border-white"></div>
            <div className="border-r border-white"></div>
            <div></div>
          </div>
          <Target className="text-blue-400 w-8 h-8 opacity-60 animate-pulse" />
          
          {/* Label */}
          <div className="absolute bottom-1 right-1 bg-blue-500 text-[8px] font-black px-1.5 py-0.5 rounded text-white tracking-widest uppercase">
            Sclera
          </div>
        </div>

        {/* Dynamic Instruction tag */}
        <div 
          className="absolute pointer-events-none transition-all duration-75 flex flex-col items-center"
          style={{ left: roi.x + ROI_SIZE / 2, top: roi.y - 45, transform: 'translateX(-50%)' }}
        >
          <div className="glass-light text-slate-900 text-[9px] font-black px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1">
            <MoveHorizontal className="w-3 h-3" /> DRAG TO POSITION
          </div>
          <div className="w-0.5 h-3 bg-white mt-0.5 opacity-50"></div>
        </div>
      </div>

      <div className="p-8 pb-12 bg-white flex gap-4 border-t border-slate-100 shadow-[0_-15px_30px_rgba(0,0,0,0.1)]">
        <button onClick={onCancel} className="flex-1 border border-slate-200 py-5 rounded-3xl font-black text-slate-500 flex items-center justify-center gap-2 active:scale-95 transition-all">
          <X className="w-5 h-5" /> 撮り直し
        </button>
        <button onClick={processAnalysis} className="flex-1 bg-blue-600 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-200 active:scale-95 transition-all">
          <Check className="w-5 h-5" /> 解析実行
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default SegmentView;