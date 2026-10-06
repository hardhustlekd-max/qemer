import React from 'react';
import { LiveScore } from '../providers/types.js';

interface LiveScoresTickerProps {
  liveScores: LiveScore[];
  providerName?: string;
}

export const LiveScoresTicker: React.FC<LiveScoresTickerProps> = ({ liveScores }) => {
  if (!liveScores || liveScores.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800/80 px-4 py-2 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar text-xs">
        {/* IN-PLAY Badge without bracketed provider text */}
        <div className="flex items-center gap-1.5 shrink-0 font-bold text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>IN-PLAY</span>
        </div>

        {/* Live Scores Items */}
        <div className="flex items-center gap-3">
          {liveScores.map((s) => (
            <div
              key={s.fixtureId}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1 shrink-0 transition-colors shadow-xs"
            >
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                {s.status === 'FINISHED' ? 'FT' : `${s.minute}'`}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{s.homeTeam}</span>
              <span className="font-mono font-bold bg-slate-200/90 dark:bg-slate-800 text-slate-900 dark:text-white px-1.5 py-0.5 rounded text-[11px] border border-slate-300 dark:border-slate-700">
                {s.homeScore} - {s.awayScore}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{s.awayTeam}</span>
              {s.events && s.events.length > 0 && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium ml-1 truncate max-w-[160px]">
                  {s.events[s.events.length - 1].type === 'GOAL' ? 'GOAL: ' : ''}
                  {s.events[s.events.length - 1].player} ({s.events[s.events.length - 1].minute}&apos;)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
