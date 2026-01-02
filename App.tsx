
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

  // ファイル読み込み処理
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

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (state === AppState.INITIAL) setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (state === AppState.INITIAL) {
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    }
  };

  return (
    <div 
      className="min-h-screen max-w-md mx-auto bg-white flex flex-col shadow-xl transition-colors duration-300"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-blue-600/90 flex flex-col items-center justify-center text-white p-6 text-center pointer-events-none">
          <Upload className="w-20 h-20 mb-4 animate-bounce" />
          <p className="text-2xl font-bold">画像をドロップして解析</p>
          <p className="opacity-80">解析する白目の写真を選択してください</p>
        </div>
      )}

      {/* Header */}
      <header className="p-4 border-b bg-white sticky top-0 z-50 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <Eye className="w-6 h-6" />
          黄疸検知ツール
        </h1>
        {state !== AppState.INITIAL && (
          <button 
            onClick={reset}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto">
        {state === AppState.INITIAL && (
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold leading-tight">
                非侵襲的ビリルビン測定
              </h2>
              <p className="text-gray-600">
                長崎大学の研究に基づく、強膜（白目）の色解析による血清ビリルビン値の推定アプリです。
              </p>
            </div>

            {/* Methods Selection */}
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={startAnalysis}
                className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-lg shadow-blue-200 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Camera className="w-8 h-8" />
                <span>カメラで撮影</span>
              </button>
              
              <div className="relative">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={onFileChange} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white border-2 border-dashed border-gray-300 text-gray-600 font-bold py-5 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform hover:border-blue-400 hover:text-blue-600 group"
                >
                  <FileImage className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                  <span>画像をアップロード</span>
                  <span className="text-[10px] font-normal text-gray-400">またはドラッグ＆ドロップ</span>
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-blue-800">
                <Info className="w-5 h-5" />
                撮影・写真の注意点
              </h3>
              <ul className="space-y-3 text-sm text-blue-700">
                <li className="flex items-start gap-3">
                  <div className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs mt-0.5">1</div>
                  <span><strong>自然な屋内光</strong>の下で撮影されたものを使用してください。</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs mt-0.5">2</div>
                  <span>フラッシュによる<strong>白飛びがない</strong>ことを確認してください。</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs mt-0.5">3</div>
                  <span>強膜（白目）がはっきりと写っている画像を選んでください。</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <p className="text-xs text-center text-gray-400 px-6 leading-relaxed">
                本ツールはスクリーニングの補助を目的としており、医療診断や血液検査の代わりにはなりません。必ず医師の診断を受けてください。
              </p>
            </div>
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
          <ResultsView result={analysisResult} onReset={reset} />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="p-4 bg-gray-50 border-t text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
          Validated Lab b-Channel Method • 長崎大学研究引用
        </p>
      </footer>
    </div>
  );
};

export default App;
