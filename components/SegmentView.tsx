
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Check, X, Maximize, ZoomIn, ZoomOut, Target } from 'lucide-react';
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
  
  // Interaction State
  const [zoom, setZoom] = useState(2.0); // Start with 2x zoom for clarity
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });

  const ROI_SIZE = 90; // Slightly larger circular frame for better visibility

  // Drag logic to pan the image
  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setLastTouch({ x: clientX, y: clientY });
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const dx = clientX - lastTouch.x;
    const dy = clientY - lastTouch.y;
    
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastTouch({ x: clientX, y: clientY });
  };

  const handleEnd = () => setIsDragging(false);

  const processAnalysis = () => {
    if (!imgRef.current || !canvasRef.current || !containerRef.current) return;
    
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    const rect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;
    
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    const scaleX = naturalWidth / rect.width;
    const scaleY = naturalHeight / rect.height;
    
    const roiSourceCenterX = (centerX - rect.left) * scaleX;
    const roiSourceCenterY = (centerY - rect.top) * scaleY;
    
    const sourceSizeX = ROI_SIZE * scaleX;
    const sourceSizeY = ROI_SIZE * scaleY;
    
    const sourceX = Math.max(0, roiSourceCenterX - sourceSizeX / 2);
    const sourceY = Math.max(0, roiSourceCenterY - sourceSizeY / 2);

    canvas.width = sourceSizeX;
    canvas.height = sourceSizeY;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (ctx) {
      // Create a circular clip on the canvas for actual analysis sampling
      ctx.beginPath();
      ctx.arc(sourceSizeX / 2, sourceSizeY / 2, sourceSizeX / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(
        img, 
        sourceX, sourceY, sourceSizeX, sourceSizeY,
        0, 0, sourceSizeX, sourceSizeY
      );
      
      const bValue = calculateMedianBChannel(ctx, sourceSizeX, sourceSizeY);
      
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
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden h-full">
      {/* Precision Header */}
      <div className="px-6 py-4 glass-dark text-white border-b border-white/10 z-20 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Micro-Scope Targeting</span>
          <span className="text-xs font-bold text-slate-300">画像をスライドして円の中央に合わせる</span>
        </div>
        <div className="bg-blue-500/20 px-4 py-1.5 rounded-full border border-blue-500/40 shadow-inner">
          <span className="text-[11px] font-black text-blue-300 tracking-tighter">ZOOM ×{zoom.toFixed(1)}</span>
        </div>
      </div>

      {/* Main Viewport */}
      <div 
        ref={containerRef}
        className="relative flex-1 overflow-hidden touch-none bg-black flex items-center justify-center select-none"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {/* Panned/Zoomed Image */}
        <img 
          ref={imgRef}
          src={imageUrl} 
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)'
          }}
          className="max-w-none w-full h-full object-contain pointer-events-none"
          alt="Subject"
        />
        
        {/* Advanced Circular Masking Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Use a complex radial gradient to create a sharp hole with blurred edges for the rest of the image */}
          <div className="absolute inset-0 bg-black/60" style={{
             clipPath: `path('M 0 0 H 1000 V 1000 H 0 Z M 500 500 m -${ROI_SIZE/2} 0 a ${ROI_SIZE/2} ${ROI_SIZE/2} 0 1 0 ${ROI_SIZE} 0 a ${ROI_SIZE/2} ${ROI_SIZE/2} 0 1 0 -${ROI_SIZE} 0')`,
             // Note: In a real browser viewport, we'd use calc or dynamic path, 
             // for simplicity in this React component we'll use a standard mask-image approach.
          }}></div>
          
          {/* Fallback Mask if clip-path is tricky: Semi-transparent overlay with a circular cutout */}
          <div 
            className="absolute inset-0 bg-black/60 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]"
            style={{
              maskImage: `radial-gradient(circle ${ROI_SIZE/2}px at center, transparent 100%, black 100%)`,
              WebkitMaskImage: `radial-gradient(circle ${ROI_SIZE/2}px at center, transparent 100%, black 100%)`
            }}
          ></div>
        </div>

        {/* Circular Precision Frame */}
        <div 
          style={{ width: ROI_SIZE, height: ROI_SIZE }}
          className="absolute rounded-full border-2 border-blue-400/80 shadow-[0_0_40px_rgba(59,130,246,0.5),inset_0_0_20px_rgba(59,130,246,0.3)] pointer-events-none flex items-center justify-center"
        >
          {/* Animated Scanning Circle */}
          <div className="absolute inset-0 rounded-full border border-blue-400/20 animate-ping opacity-30"></div>
          
          {/* Precision Crosshairs */}
          <div className="absolute w-full h-[0.5px] bg-blue-400/40"></div>
          <div className="absolute h-full w-[0.5px] bg-blue-400/40"></div>
          
          {/* Internal Target Circle */}
          <div className="w-2 h-2 rounded-full border border-blue-400/60 bg-blue-400/10"></div>
          
          {/* Targeting Brackets */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-lg"></div>
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-lg"></div>
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-lg"></div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-lg"></div>

          {/* Label Display */}
          <div className="absolute -bottom-12 flex flex-col items-center">
             <div className="bg-blue-600/90 backdrop-blur-md text-white text-[8px] font-black px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/20 uppercase tracking-widest">
               <Target className="w-3 h-3 text-blue-200" /> Sampling Spot
             </div>
          </div>
        </div>
      </div>

      {/* Control Dashboard */}
      <div className="bg-white p-8 border-t border-slate-100 flex flex-col gap-8 safe-area-bottom shadow-[0_-20px_50px_rgba(0,0,0,0.1)] rounded-t-[3rem]">
        {/* Enhanced Zoom Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Magnification</span>
            <span className="text-sm font-black text-blue-600">×{zoom.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setZoom(prev => Math.max(1, prev - 0.5))}
              className="p-2 bg-slate-50 rounded-xl text-slate-400 active:bg-blue-50 active:text-blue-600 transition-colors"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="0.1" 
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
            />
            <button 
              onClick={() => setZoom(prev => Math.min(10, prev + 0.5))}
              className="p-2 bg-slate-50 rounded-xl text-slate-400 active:bg-blue-50 active:text-blue-600 transition-colors"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 bg-slate-50 py-5 rounded-[1.5rem] font-black text-slate-400 flex items-center justify-center gap-2 active:scale-95 transition-all border border-slate-100"
          >
            <X className="w-5 h-5" /> 戻る
          </button>
          <button 
            onClick={processAnalysis}
            className="flex-[2] bg-slate-900 text-white py-5 px-8 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-2xl shadow-slate-300 active:scale-95 transition-all"
          >
            <Maximize className="w-5 h-5 text-blue-400" /> 精密解析を開始
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default SegmentView;
