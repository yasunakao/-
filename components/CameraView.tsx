
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera as CameraIcon } from 'lucide-react';

interface Props {
  onCapture: (imageData: string) => void;
}

const CameraView: React.FC<Props> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("カメラへのアクセスが拒否されました。設定を確認してください。");
      }
    }
    setupCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

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

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Eye Guide Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-32 border-2 border-dashed border-white/50 rounded-[50%] shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-16 h-16 border border-white/30 rounded-full bg-white/10"></div>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-24 text-white text-xs font-semibold bg-black/40 px-3 py-1 rounded-full text-center">
            目をガイドの中央に合わせてください<br/>（約30cm離す）
          </div>
        </div>
      </div>

      <div className="p-8 bg-black flex justify-center">
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
