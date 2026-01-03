import React from 'react';
import { Share2, RefreshCcw, AlertCircle, CheckCircle2, Info, ChevronRight, Activity, TrendingUp } from 'lucide-react';
import { AnalysisResult, JaundiceCategory } from '../types';
import { B_CHANNEL_THRESHOLD, getBilirubinEstimate } from '../constants';
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  result: AnalysisResult;
  onReset: () => void;
}

const ResultsView: React.FC<Props> = ({ result, onReset }) => {
  const estTSB = getBilirubinEstimate(result.bValue);
  
  const categoryConfig = {
    [JaundiceCategory.NORMAL]: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <CheckCircle2 className="w-6 h-6" /> },
    [JaundiceCategory.SUBCLINICAL]: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <AlertCircle className="w-6 h-6" /> },
    [JaundiceCategory.OVERT]: { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: <AlertCircle className="w-6 h-6" /> },
  }[result.prediction];

  const chartData = [{ name: 'Current', value: result.bValue }];

  return (
    <div className="flex flex-col min-h-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Result Status Header */}
      <div className={`p-8 ${categoryConfig.bg} border-b ${categoryConfig.border} flex flex-col items-center text-center space-y-4`}>
        <div className={`${categoryConfig.color} bg-white p-3 rounded-2xl shadow-sm`}>
          {categoryConfig.icon}
        </div>
        <div>
          <h2 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">解析ステータス</h2>
          <p className={`text-2xl font-black ${categoryConfig.color}`}>{result.prediction}</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Main Score Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20 transform rotate-12">
             <Activity className="w-32 h-32" />
          </div>
          <div className="relative">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">推定血清ビリルビン値</p>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black tracking-tighter">
                {estTSB.toFixed(1)}
              </span>
              <span className="text-xl font-bold text-slate-500">mg/dL</span>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-1">Lab b値</p>
                <p className="text-2xl font-black">{result.bValue.toFixed(1)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-1">信頼性</p>
                <p className="text-2xl font-black text-emerald-400 flex items-center justify-end gap-1">
                  High <TrendingUp className="w-5 h-5" />
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Meter Section */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="font-black text-slate-800">カラーチャネル比較</h3>
              <p className="text-xs text-slate-400 font-medium">カットオフ閾値: {B_CHANNEL_THRESHOLD}</p>
            </div>
          </div>
          
          <div className="h-20 w-full bg-slate-50 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={chartData}>
                <XAxis type="number" domain={[115, 175]} hide />
                <YAxis type="category" dataKey="name" hide />
                <ReferenceLine x={B_CHANNEL_THRESHOLD} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={24}>
                  <Cell fill={result.bValue >= B_CHANNEL_THRESHOLD ? '#f43f5e' : '#10b981'} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
            <span>Normal (Low)</span>
            <span className="text-slate-600">Threshold</span>
            <span>Icterus (High)</span>
          </div>
        </div>

        {/* Medical Insight */}
        <div className="bg-slate-50 rounded-3xl p-6 flex gap-4">
          <div className="bg-blue-100 p-2 rounded-xl self-start">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-slate-800 text-sm">専門的な解説</h4>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Lab bチャネル値は強膜の黄色味を数値化したものです。今回の値 <strong>{result.bValue.toFixed(1)}</strong> は、統計的にビリルビン値 <strong>{estTSB.toFixed(1)} mg/dL</strong> 程度に相当すると推定されます。
            </p>
            <button className="text-blue-600 text-xs font-black flex items-center gap-1 mt-2 uppercase tracking-wider">
              研究論文を読む <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 pb-12">
          <button 
            onClick={onReset}
            className="bg-white border border-slate-200 text-slate-700 font-black py-5 rounded-3xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            <RefreshCcw className="w-5 h-5 text-slate-400" /> 再測定
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-200"
          >
            <Share2 className="w-5 h-5" /> 共有する
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;