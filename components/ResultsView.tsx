
import React from 'react';
import { Share2, RefreshCcw, AlertCircle, CheckCircle2, Info, ChevronRight, Eye } from 'lucide-react';
import { AnalysisResult, JaundiceCategory } from '../types';
import { B_CHANNEL_THRESHOLD, getBilirubinEstimate } from '../constants';
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  result: AnalysisResult;
  onReset: () => void;
}

const ResultsView: React.FC<Props> = ({ result, onReset }) => {
  const estTSB = getBilirubinEstimate(result.bValue);
  
  const getCategoryColor = () => {
    switch (result.prediction) {
      case JaundiceCategory.NORMAL: return 'text-green-600 bg-green-50 border-green-100';
      case JaundiceCategory.SUBCLINICAL: return 'text-orange-600 bg-orange-50 border-orange-100';
      case JaundiceCategory.OVERT: return 'text-red-600 bg-red-50 border-red-100';
    }
  };

  const chartData = [
    { name: 'Current', value: result.bValue }
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-gray-500 font-bold text-xs uppercase tracking-widest">解析結果</h2>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getCategoryColor()}`}>
          {result.prediction === JaundiceCategory.NORMAL ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-bold">{result.prediction}</span>
        </div>
      </div>

      {/* Hero Result */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <Eye className="w-24 h-24" />
        </div>
        <div className="relative">
          <p className="text-blue-100 text-sm font-medium">推定血清ビリルビン値 (TSB)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-5xl font-black">~{estTSB.toFixed(1)}</span>
            <span className="text-xl font-medium opacity-80">mg/dL</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase opacity-70 font-bold tracking-wider">Lab bチャネル中央値</p>
              <p className="text-lg font-bold">{result.bValue.toFixed(1)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase opacity-70 font-bold tracking-wider">カットオフ閾値</p>
              <p className="text-lg font-bold">{B_CHANNEL_THRESHOLD}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-700 flex items-center justify-between">
          <span>比較スケール</span>
          <span className="text-[10px] text-gray-400 font-normal italic">値が高いほどビリルビン値が高くなります</span>
        </h3>
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis type="number" domain={[110, 180]} hide />
              <YAxis type="category" dataKey="name" hide />
              <ReferenceLine x={B_CHANNEL_THRESHOLD} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: '閾値', fontSize: 10, fill: '#ef4444' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                <Cell fill={result.bValue >= B_CHANNEL_THRESHOLD ? '#f97316' : '#22c55e'} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          結果の解説
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          CIE Lab bチャネルは強膜（白目）の黄色味を測定します。中央値が <strong>{B_CHANNEL_THRESHOLD}</strong> を超える場合、ビリルビン値の上昇（高ビリルビン血症）の可能性があり、臨床的な確認が推奨されます。
        </p>
        <div className="pt-2">
           <a 
            href="https://pubmed.ncbi.nlm.nih.gov/?term=scleral+bilirubin+Lab+color" 
            target="_blank" 
            className="text-blue-600 text-xs font-semibold flex items-center gap-1"
           >
            研究背景を確認する <ChevronRight className="w-3 h-3" />
           </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pb-8">
        <button 
          onClick={onReset}
          className="bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
        >
          <RefreshCcw className="w-5 h-5" /> 新しいテスト
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
        >
          <Share2 className="w-5 h-5" /> 結果を共有
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
