
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera as CameraIcon, AlertCircle, RefreshCw, SwitchCamera } from 'lucide-react';

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
      
      // Stop existing stream before starting a new one
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: { 
          facingMode: facingMode, 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false
      };
      
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.error("Auto-play failed", e);
        }
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setIsInitializing(false);
      if (err.name === 'NotAllowedError') {
        setError("カメラの使用が許可されていません。設定からカメラ権限を有効にしてください。");
      } else {
        setError("カメラを起動できませんでした。HTTPS接続か、対応ブラウザか確認してください。");
      }
    }
  }, [facingMode]);

  useEffect(() => {
    setupCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Handle mirroring for front camera
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-900 text-white text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="mb-6 text-sm">{error}</p>
        <button 
          onClick={setupCamera}
          className="bg-blue-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 active:scale-95 transition-transform"
        >
          <RefreshCw className="w-5 h-5" /> 再試行
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden relative">
      <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        
        {/* Guide Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-32 border-2 border-dashed border-white/50 rounded-[50%] shadow-[0_0_0_2000px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-10 h-10 border border-white/20 rounded-full bg-white/5"></div>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-32 text-white text-[10px] font-bold bg-black/60 px-4 py-2 rounded-full backdrop-blur-md uppercase tracking-widest">
            白目を中央に合わせて撮影
          </div>
        </div>

        {isInitializing && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white gap-4">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-xs opacity-70">カメラ初期化中...</p>
          </div>
        )}
      </div>

      <div className="px-8 py-10 bg-black flex items-center justify-between border-t border-white/10 safe-area-bottom">
        <div className="w-12 h-12" /> {/* Spacer */}
        
        <button 
          onClick={capture}
          disabled={isInitializing}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform disabled:opacity-50"
        >
          <div className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center">
            <CameraIcon className="w-8 h-8 text-black" />
          </div>
        </button>

        <button 
          onClick={toggleCamera}
          disabled={isInitializing}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
        >
          <SwitchCamera className="w-6 h-6 text-white" />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
