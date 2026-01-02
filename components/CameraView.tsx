
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera as CameraIcon, AlertCircle } from 'lucide-react';

interface Props {
  onCapture: (imageData: string) => void;
}

const CameraView: React.FC<Props> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setupCamera = useCallback(async () => {
    try {
      setError(null);
      const constraints = {
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false
      };
      
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        // iOS Safari requires play() to be called
        await videoRef.current.play().catch(e => console.error("Play failed", e));
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError') {
        setError("カメラの使用が許可されていません。設定からブラウザのカメラ権限をオンにしてください。");
      } else {
        setError("カメラを起動できませんでした。ブラウザが最新か、HTTPS接続されているか確認してください。");
      }
    }
  }, []);

  useEffect(() => {
    setupCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [setupCamera]);

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        onCapture(canvas.toDataURL('image/jpeg', 0.9));
      }
    }
  }, [onCapture]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-900 text-white text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="mb-6">{error}</p>
        <button 
          onClick={setupCamera}
          className="bg-blue-600 px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform"
        >
          再試行する
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden">
      <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Eye Guide Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-32 border-2 border-dashed border-white/50 rounded-[50%] shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-12 h-12 border border-white/30 rounded-full bg-white/5"></div>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-28 text-white text-[10px] font-bold bg-black/60 px-4 py-2 rounded-full text-center backdrop-blur-sm">
            白目をガイドの中央に合わせてください
          </div>
        </div>
      </div>

      <div className="p-8 pb-12 bg-black flex justify-center border-t border-white/10">
        <button 
          onClick={capture}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        >
          <div className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center">
            <CameraIcon className="w-8 h-8 text-black" />
          </div>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
