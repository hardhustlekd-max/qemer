import React from 'react';
import { LiveScore } from '../providers/types.js';

interface LiveScoresTickerProps {
  liveScores: LiveScore[];
  providerName?: string;
}

export const LiveScoresTicker: React.FC<LiveScoresTickerProps> = ({ liveScores }) => {
  if (!liveScores || liveScores.length === 0) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-2 transition-colors shadow-xs shadow-slate-900/5">
      <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar text-xs">
        {/* IN-PLAY Badge */}
        <div className="flex items-center gap-1.5 shrink-0 font-bold text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full shadow-xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>IN-PLAY</span>
        </div>

        {/* Live Scores Items */}
        <div className="flex items-center gap-2.5">
          {liveScores.map((s) => (
            <div
              key={s.fixtureId}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/80 rounded-xl px-3 py-1.5 shrink-0 transition-all shadow-sm hover:shadow-md"
            >
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                {s.status === 'FINISHED' ? 'FT' : `${s.minute}'`}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{s.homeTeam}</span>
              <span className="font-mono font-bold bg-slate-200/90 dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-0.5 rounded-lg text-[11px] shadow-xs">
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
