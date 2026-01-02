import React, { useState, useCallback, useRef } from 'react';
import { Camera, RefreshCcw, Eye, Info, ChevronRight, AlertCircle, CheckCircle2, Upload, FileImage } from 'lucide-react';
import { AppState, AnalysisResult, JaundiceCategory } from './types';
import CameraView from './components/CameraView';
import SegmentView from './components/SegmentView';
import ResultsView from './components/ResultsView';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.INITIAL);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startAnalysis = () => setState(AppState.CAPTURE);

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setState(AppState.SEGMENT);
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
    setState(AppState.RESULTS);
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setState(AppState.INITIAL);
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setCapturedImage(result);
          setState(AppState.SEGMENT);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('画像ファイルを選択してください。');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="h-[100dvh] max-w-md mx-auto bg-white flex flex-col shadow-xl overflow-hidden relative">
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-blue-600/90 flex flex-col items-center justify-center text-white p-6 text-center pointer-events-none">
          <Upload className="w-20 h-20 mb-4 animate-bounce" />
          <p className="text-2xl font-bold">画像をドロップ</p>
        </div>
      )}

      {/* Header */}
      <header className="px-4 py-3 border-b bg-white flex items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-extrabold text-blue-600 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          黄疸検知
        </h1>
        {state !== AppState.INITIAL && (
          <button 
            onClick={reset}
            className="p-2 text-gray-400 hover:text-blue-600"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-gray-50">
        {state === AppState.INITIAL && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                スマホで白目から<br/><span className="text-blue-600">黄疸チェック</span>
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                長崎大学の研究（Lab b-channel法）に基づき、白目の色から血清ビリルビン値を推定します。
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={startAnalysis}
                className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Camera className="w-8 h-8" />
                <span>カメラで撮影する</span>
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white border-2 border-gray-100 text-gray-600 font-bold py-5 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <FileImage className="w-8 h-8 text-gray-300" />
                <span>アルバムから選ぶ</span>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
              </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-gray-700">
                <Info className="w-4 h-4 text-blue-500" />
                撮影のヒント
              </h3>
              <ul className="space-y-3 text-xs text-gray-500">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>明るい場所で、影が入らないように</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>フラッシュはオフにしてください</span>
                </li>
              </ul>
            </div>
            
            <p className="text-[10px] text-center text-gray-400 leading-relaxed px-4">
              ※本アプリは医療機器ではありません。結果はあくまで目安であり、診断には医師による検査が必要です。
            </p>
          </div>
        )}

        {state === AppState.CAPTURE && (
          <CameraView onCapture={handleCapture} />
        )}

        {state === AppState.SEGMENT && capturedImage && (
          <SegmentView 
            imageUrl={capturedImage} 
            onComplete={handleAnalysisComplete} 
            onCancel={reset}
          />
        )}

        {state === AppState.RESULTS && analysisResult && (
          <div className="flex-1 overflow-y-auto">
            <ResultsView result={analysisResult} onReset={reset} />
          </div>
        )}
      </main>

      <footer className="p-3 bg-white border-t text-center flex-shrink-0">
        <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">
          Precision Health Lab • Scleral Icterus Detection
        </p>
      </footer>
    </div>
  );
};

export default App;