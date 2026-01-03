/// <reference types="react" />
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Check, X, Maximize, ZoomIn, ZoomOut, Target, Sparkles, Crosshair } from 'lucide-react';
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
  
  const [zoom, setZoom] = useState(4.0); 
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });

  // ROI_SIZE reduced to 60px for better fit on narrow scleral regions
  const ROI_SIZE = 60; 

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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
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
    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden h-full">
      {/* Precision Header */}
      <div className="px-6 py-4 glass-dark text-white border-b border-white/10 z-20 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Precision Micro-Sampling</span>
          <span className="text-xs font-bold text-white">白目の黄色い部分を円の中央に</span>
        </div>
        <div className="bg-blue-600 px-3 py-1 rounded-full border border-blue-400 shadow-lg">
          <span className="text-[10px] font-black text-white">MAG ×{zoom.toFixed(1)}</span>
        </div>
      </div>

      {/* Main Viewport */}
      <div 
        ref={containerRef}
        className="relative flex-1 overflow-hidden touch-none bg-slate-950 flex items-center justify-center select-none cursor-move"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        <img 
          ref={imgRef}
          src={imageUrl} 
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
          className="max-w-none w-full h-full object-contain pointer-events-none opacity-100"
          alt="Subject"
        />
        
        {/* Minimized Dimming for better visibility */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/20 pointer-events-none"
            style={{
              maskImage: `radial-gradient(circle ${ROI_SIZE/2}px at center, transparent 99%, black 100%)`,
              WebkitMaskImage: `radial-gradient(circle ${ROI_SIZE/2}px at center, transparent 99%, black 100%)`
            }}
          ></div>
        </div>

        {/* Smaller Circular Reticle */}
        <div 
          style={{ width: ROI_SIZE, height: ROI_SIZE }}
          className="absolute rounded-full border-[2px] border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.3),inset_0_0_15px_rgba(59,130,246,0.2)] pointer-events-none flex items-center justify-center"
        >
          <div className="absolute inset-[-6px] rounded-full border border-blue-400/20 animate-[pulse_2s_infinite]"></div>
          
          {/* High Precision Crosshairs */}
          <div className="absolute w-4 h-[1px] bg-blue-400"></div>
          <div className="absolute h-4 w-[1px] bg-blue-400"></div>
          
          {/* Target Label */}
          <div className="absolute -bottom-10 flex flex-col items-center">
             <div className="bg-slate-900/80 backdrop-blur-sm text-white text-[7px] font-black px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest whitespace-nowrap">
               Target Area
             </div>
          </div>
        </div>
      </div>

      {/* Control Dashboard */}
      <div className="bg-white p-6 border-t border-slate-100 flex flex-col gap-6 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-[2.5rem]">
        {/* Magnification Control */}
        <div className="space-y-3 px-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ultra Zoom</span>
            <div className="flex items-center gap-1.5">
               <Crosshair className="w-3 h-3 text-blue-500" />
               <span className="text-sm font-black text-slate-900">{zoom.toFixed(1)}x</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setZoom(prev => Math.max(1, prev - 1))} className="p-2 bg-slate-50 rounded-lg"><ZoomOut className="w-4 h-4 text-slate-400" /></button>
            <input 
              type="range" min="1" max="15" step="0.1" value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
            />
            <button onClick={() => setZoom(prev => Math.min(15, prev + 1))} className="p-2 bg-slate-50 rounded-lg"><ZoomIn className="w-4 h-4 text-slate-400" /></button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 bg-slate-50 py-4 rounded-2xl font-black text-slate-400 border border-slate-100 active:scale-95 transition-all">
            やり直し
          </button>
          <button 
            onClick={processAnalysis}
            className="flex-[2] bg-blue-600 text-white py-4 px-8 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-200 active:scale-95 transition-all"
          >
            <Maximize className="w-5 h-5" /> 解析を実行
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" /> 円内全域のLab b中央値を解析します
          </p>
          <p className="text-[8px] text-slate-300 font-medium">血管や反射を除外したロバストな統計処理</p>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default SegmentView;