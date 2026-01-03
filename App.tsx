import React, { useState, useRef } from 'react';
import { Camera, RefreshCcw, Eye, Info, CheckCircle2, FileImage, ShieldCheck, Activity } from 'lucide-react';
import { AppState, AnalysisResult } from './types';
import CameraView from './components/CameraView';
import SegmentView from './components/SegmentView';
import ResultsView from './components/ResultsView';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.INITIAL);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setCapturedImage(result);
          setState(AppState.SEGMENT);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full max-w-md mx-auto bg-slate-50 flex flex-col shadow-2xl overflow-hidden relative border-x border-slate-200">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between bg-white border-b border-slate-100 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Precision<span className="text-blue-600">Eye</span>
          </h1>
        </div>
        {state !== AppState.INITIAL && (
          <button onClick={reset} className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 rounded-full">
            <RefreshCcw className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {state === AppState.INITIAL && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Hero Section */}
            <div className="pt-4 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> AI Analysis Platform
              </div>
              <h2 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tight">
                スマホで始める<br/><span className="text-blue-600 italic">高度な</span>黄疸検知
              </h2>
              <p className="text-slate-500 leading-relaxed font-medium">
                長崎大学の研究に基づいた Lab b-channel解析を用いて、非侵襲的にビリルビン値を推定します。
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={startAnalysis}
                className="group relative overflow-hidden w-full bg-slate-900 text-white p-6 rounded-3xl shadow-2xl shadow-slate-200 flex items-center justify-between active:scale-[0.98] transition-all"
              >
                <div className="relative z-10 flex flex-col items-start text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Recommended</span>
                  <span className="text-xl font-black">カメラでスキャン</span>
                </div>
                <div className="relative z-10 bg-white/10 p-4 rounded-2xl group-hover:bg-blue-600 transition-colors">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white border border-slate-200 text-slate-700 p-6 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-all"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Alternative</span>
                  <span className="text-xl font-black">アルバムから選択</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <FileImage className="w-8 h-8 text-slate-400" />
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
              </button>
            </div>

            {/* Instruction List */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black flex items-center gap-2 text-slate-800">
                <Info className="w-5 h-5 text-blue-500" />
                最高精度のためのヒント
              </h3>
              <div className="space-y-4">
                {[
                  { text: "自然光の入る明るい室内で撮影", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
                  { text: "フラッシュは使用しないでください", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
                  { text: "白目の最も広い部分を正面から", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 bg-emerald-50 p-0.5 rounded-full">{item.icon}</div>
                    <span className="text-sm text-slate-500 font-semibold">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 font-bold leading-relaxed px-8">
              ※本ツールは医学的診断を提供するものではありません。疑いがある場合は速やかに医療機関を受診してください。
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
          <div className="flex-1 overflow-y-auto bg-white">
            <ResultsView result={analysisResult} onReset={reset} />
          </div>
        )}
      </main>

      <footer className="p-4 bg-white border-t border-slate-100 text-center flex-shrink-0 safe-area-bottom">
        <p className="text-[9px] text-slate-300 font-black tracking-[0.2em] uppercase">
          Precision Eye v2.0 • Scleral Icterus Tech
        </p>
      </footer>
    </div>
  );
};

export default App;