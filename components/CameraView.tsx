/// <reference types="react" />
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera as CameraIcon, AlertCircle, RefreshCw, SwitchCamera, X } from 'lucide-react';

interface Props {
  onCapture: (imageData: string) => void;
}

const CameraView: React.FC<Props> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const setupCamera = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.error(err);
      setIsInitializing(false);
      setError("カメラの初期化に失敗しました。設定を確認してください。");
    }
  }, [facingMode]);

  useEffect(() => {
    setupCamera();
    return () => stream?.getTracks().forEach(track => track.stop());
  }, [facingMode]);

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        onCapture(canvas.toDataURL('image/jpeg', 0.9));
      }
    }
  }, [onCapture, facingMode]);

  if (error) {
    return (
      <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="bg-rose-500/20 p-4 rounded-full mb-4">
          <AlertCircle className="w-12 h-12 text-rose-500" />
        </div>
        <p className="font-bold mb-6">{error}</p>
        <button onClick={setupCamera} className="bg-blue-600 px-8 py-4 rounded-2xl font-black active:scale-95 transition-transform flex items-center gap-2">
          <RefreshCw className="w-5 h-5" /> 再起動
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-black relative flex flex-col overflow-hidden">
      {/* Viewport */}
      <div className="relative flex-1">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        
        {/* Modern HUD Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-72 h-40 border-[1.5px] border-white/40 rounded-[3rem] shadow-[0_0_0_2000px_rgba(0,0,0,0.6)] relative">
            {/* Focus bracket accents */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
          </div>
          
          <div className="mt-12 glass-dark px-6 py-2 rounded-full text-white text-[11px] font-black uppercase tracking-[0.2em]">
            白目をフレーム内に
          </div>
        </div>

        {isInitializing && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-xs font-bold opacity-50 tracking-widest uppercase">Initializing Sensors...</p>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="px-10 py-10 glass-dark flex items-center justify-between safe-area-bottom border-t border-white/5">
        <button onClick={() => window.location.reload()} className="w-12 h-12 glass-light rounded-full flex items-center justify-center text-slate-900 active:scale-90 transition-transform">
          <X className="w-6 h-6" />
        </button>
        
        <button 
          onClick={capture}
          disabled={isInitializing}
          className="relative w-24 h-24 flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
        >
          <div className="absolute inset-0 bg-white rounded-full opacity-20 animate-pulse"></div>
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <div className="w-16 h-16 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <CameraIcon className="w-8 h-8 text-slate-900" />
            </div>
          </div>
        </button>

        <button 
          onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
          className="w-12 h-12 glass-light rounded-full flex items-center justify-center text-slate-900 active:scale-90 transition-transform"
        >
          <SwitchCamera className="w-6 h-6" />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;