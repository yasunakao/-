
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Check, X, Maximize, ZoomIn, ZoomOut, Move } from 'lucide-react';
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
  const [zoom, setZoom] = useState(1.5); // Default slight zoom for better initial view
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });

  const ROI_SIZE = 80; // Size of the fixed center frame

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
    
    // Get current visual boundaries
    const rect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate the center of the container (where our ROI box is fixed)
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;
    
    // Calculate which part of the NATURAL image is at the center of the UI
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // Ratio between displayed image size and natural image size
    const scaleX = naturalWidth / rect.width;
    const scaleY = naturalHeight / rect.height;
    
    // The point in natural pixels that corresponds to the center of our ROI box
    const roiSourceCenterX = (centerX - rect.left) * scaleX;
    const roiSourceCenterY = (centerY - rect.top) * scaleY;
    
    // Size of the ROI in natural pixels
    const sourceSizeX = ROI_SIZE * scaleX;
    const sourceSizeY = ROI_SIZE * scaleY;
    
    // Ensure we don't sample outside the image
    const sourceX = Math.max(0, roiSourceCenterX - sourceSizeX / 2);
    const sourceY = Math.max(0, roiSourceCenterY - sourceSizeY / 2);

    canvas.width = sourceSizeX;
    canvas.height = sourceSizeY;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (ctx) {
      ctx.drawImage(
        img, 
        sourceX, sourceY, sourceSizeX, sourceSizeY, // Source rectangle
        0, 0, sourceSizeX, sourceSizeY              // Destination rectangle
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
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Precision Target</span>
          <span className="text-xs font-bold">画像を動かして白目に合わせる</span>
        </div>
        <div className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
          <span className="text-[10px] font-black text-blue-400">×{zoom.toFixed(1)}</span>
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
        {/* The Image being panned/zoomed */}
        <img 
          ref={imgRef}
          src={imageUrl} 
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          className="max-w-none w-full h-full object-contain pointer-events-none"
          alt="Subject"
        />
        
        {/* Dimming layer outside the frame */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] flex items-center justify-center">
          <div className="w-full h-full bg-black/40" style={{
            clipPath: `polygon(0% 0%, 0% 100%, calc(50% - ${ROI_SIZE/2}px) 100%, calc(50% - ${ROI_SIZE/2}px) calc(50% - ${ROI_SIZE/2}px), calc(50% + ${ROI_SIZE/2}px) calc(50% - ${ROI_SIZE/2}px), calc(50% + ${ROI_SIZE/2}px) calc(50% + ${ROI_SIZE/2}px), calc(50% - ${ROI_SIZE/2}px) calc(50% + ${ROI_SIZE/2}px), calc(50% - ${ROI_SIZE/2}px) 100%, 100% 100%, 100% 0%)`
          }}></div>
        </div>

        {/* Fixed Center ROI Frame */}
        <div 
          style={{ width: ROI_SIZE, height: ROI_SIZE }}
          className="absolute border-2 border-blue-400 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.6)] pointer-events-none flex items-center justify-center"
        >
          {/* Crosshair lines */}
          <div className="absolute w-8 h-[1px] bg-blue-400/50"></div>
          <div className="absolute h-8 w-[1px] bg-blue-400/50"></div>
          
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white rounded-br-lg"></div>

          {/* Label Tag */}
          <div className="absolute -bottom-10 flex flex-col items-center">
             <div className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
               <Maximize className="w-3 h-3" /> ANALYZE AREA
             </div>
          </div>
        </div>
      </div>

      {/* Control Tools */}
      <div className="bg-white/95 backdrop-blur-md p-6 border-t border-slate-100 flex flex-col gap-6 safe-area-bottom">
        {/* Zoom Slider */}
        <div className="flex items-center gap-4">
          <ZoomOut className="w-5 h-5 text-slate-400" />
          <input 
            type="range" 
            min="1" 
            max="5" 
            step="0.1" 
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
          />
          <ZoomIn className="w-5 h-5 text-slate-400" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 bg-slate-100 py-4 rounded-2xl font-black text-slate-500 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" /> 撮り直し
          </button>
          <button 
            onClick={processAnalysis}
            className="flex-2 bg-blue-600 text-white py-4 px-8 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-200 active:scale-95 transition-all"
          >
            <Check className="w-6 h-6" /> 解析を実行
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default SegmentView;
