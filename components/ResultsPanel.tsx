import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RecognitionResult } from '../types';

interface ResultsPanelProps {
  result: RecognitionResult | null;
  isAnalyzing: boolean;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, isAnalyzing }) => {
  if (!result && !isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 border border-slate-700 border-dashed rounded-lg bg-dark-card/30">
        <p className="text-center">Draw a digit (0-9) on the pad and click analyze to see the neural network in action.</p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
       <div className="h-full flex flex-col items-center justify-center p-8 border border-slate-700 rounded-lg bg-dark-card/30 animate-pulse">
          <div className="text-neon-blue text-xl font-mono mb-2">Processing Layers...</div>
          <div className="text-sm text-slate-400">Convolving features...</div>
          <div className="text-sm text-slate-400">Activating ReLUs...</div>
          <div className="text-sm text-slate-400">Calculating Softmax...</div>
       </div>
    );
  }

  // Prepare data for chart
  const data = result?.probabilities.map((prob, index) => ({
    digit: index,
    probability: prob,
  })) || [];

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto">
      {/* Prediction Header */}
      <div className="flex items-center justify-between bg-dark-card p-4 rounded-lg border-l-4 border-neon-green shadow-lg">
        <div>
          <h2 className="text-sm text-slate-400 uppercase tracking-wider">Model Prediction</h2>
          <div className="text-4xl font-bold text-white mt-1">
            Digit: <span className="text-neon-green">{result?.prediction}</span>
          </div>
        </div>
        <div className="text-right">
            <div className="text-xs text-slate-400">Confidence</div>
            <div className="text-2xl font-mono text-neon-blue">
                {result ? (Math.max(...result.probabilities) * 100).toFixed(1) : 0}%
            </div>
        </div>
      </div>

      {/* Explanation Text */}
      <div className="bg-dark-card p-4 rounded-lg border border-slate-700">
        <h3 className="text-neon-purple font-semibold mb-2 text-sm uppercase tracking-wide">Analysis</h3>
        <p className="text-slate-300 text-sm leading-relaxed mb-2">
          {result?.explanation}
        </p>
        <p className="text-xs text-slate-500 italic border-t border-slate-700 pt-2 mt-2">
            Feature Map: {result?.featureMapDescription}
        </p>
      </div>

      {/* Probability Chart */}
      <div className="flex-grow min-h-[200px] bg-dark-card p-4 rounded-lg border border-slate-700">
        <h3 className="text-slate-400 text-xs uppercase mb-4">Softmax Probability Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" hide domain={[0, 1]} />
            <YAxis 
                type="category" 
                dataKey="digit" 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8' }} 
                width={20}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Confidence']}
            />
            <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={index === result?.prediction ? '#0aff0a' : '#3b82f6'} 
                    fillOpacity={index === result?.prediction ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ResultsPanel;