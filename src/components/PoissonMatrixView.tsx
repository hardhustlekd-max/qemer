import React from 'react';
import { PoissonPrediction } from '../core/types.js';

interface PoissonMatrixViewProps {
  prediction: PoissonPrediction;
  homeTeam: string;
  awayTeam: string;
}

export const PoissonMatrixView: React.FC<PoissonMatrixViewProps> = ({
  prediction,
  homeTeam,
  awayTeam,
}) => {
  const matrix = prediction.probabilityMatrix || [];

  // Find max prob for color scaling
  let maxProb = 0.01;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < (matrix[r]?.length || 0); c++) {
      if (matrix[r][c] > maxProb) maxProb = matrix[r][c];
    }
  }

  const getHeatmapColor = (prob: number) => {
    const intensity = Math.min(1, prob / maxProb);
    if (intensity < 0.1) return 'bg-slate-900/40 text-slate-500';
    if (intensity < 0.3) return 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/30';
    if (intensity < 0.6) return 'bg-emerald-900/60 text-emerald-200 font-semibold border border-emerald-700/50';
    return 'bg-emerald-600/80 text-white font-bold shadow-sm shadow-emerald-500/20 border border-emerald-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Poisson Score Heatmap (Home vs Away Goals)
        </h4>
        <div className="text-[11px] text-slate-400">
          xG: <span className="text-emerald-400 font-mono font-semibold">{homeTeam} {prediction.homeXG}</span> - <span className="text-cyan-400 font-mono font-semibold">{prediction.awayXG} {awayTeam}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono">
            {/* Top Header Row (Away Goals) */}
            <div className="p-1 text-slate-500 font-sans text-[10px] flex items-center justify-center">
              H \ A
            </div>
            {[0, 1, 2, 3, 4, 5].map((ag) => (
              <div key={`away-h-${ag}`} className="p-1 bg-slate-900/60 rounded text-cyan-400 font-bold text-[11px]">
                {ag}
              </div>
            ))}

            {/* Matrix Rows (Home Goals) */}
            {[0, 1, 2, 3, 4, 5].map((hg) => (
              <React.Fragment key={`row-${hg}`}>
                <div className="p-1 bg-slate-900/60 rounded text-emerald-400 font-bold text-[11px] flex items-center justify-center">
                  {hg}
                </div>
                {[0, 1, 2, 3, 4, 5].map((ag) => {
                  const prob = matrix[hg]?.[ag] || 0;
                  const pct = (prob * 100).toFixed(1);
                  return (
                    <div
                      key={`cell-${hg}-${ag}`}
                      className={`p-1.5 rounded transition-colors text-[11px] flex flex-col items-center justify-center ${getHeatmapColor(
                        prob
                      )}`}
                      title={`${homeTeam} ${hg} - ${ag} ${awayTeam}: ${pct}% probability`}
                    >
                      <span>{pct}%</span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Top Correct Scores breakdown */}
      <div className="pt-2">
        <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Top Probability Correct Scores
        </h5>
        <div className="grid grid-cols-5 gap-2">
          {prediction.topCorrectScores.map((score, idx) => (
            <div
              key={score.score}
              className={`p-2 rounded-lg border text-center ${
                idx === 0
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300'
              }`}
            >
              <div className="text-xs font-mono font-bold">{score.score}</div>
              <div className="text-[11px] font-mono text-slate-400">
                {(score.probability * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
