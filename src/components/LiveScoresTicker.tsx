import React from 'react';
import { Activity, Flame } from 'lucide-react';
import { LiveScore } from '../providers/types.js';

interface LiveScoresTickerProps {
  liveScores: LiveScore[];
  providerName: string;
}

export const LiveScoresTicker: React.FC<LiveScoresTickerProps> = ({ liveScores, providerName }) => {
  if (!liveScores || liveScores.length === 0) return null;

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar text-xs">
        <div className="flex items-center gap-1.5 shrink-0 font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/50">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>IN-PLAY ({providerName})</span>
        </div>

        <div className="flex items-center gap-4">
          {liveScores.map((s) => (
            <div
              key={s.fixtureId}
              className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-md px-3 py-1 shrink-0"
            >
              <span className="font-mono text-amber-400 font-medium">{s.minute}&apos;</span>
              <span className="font-medium text-slate-200">{s.homeTeam}</span>
              <span className="font-mono font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded text-[11px]">
                {s.homeScore} - {s.awayScore}
              </span>
              <span className="font-medium text-slate-200">{s.awayTeam}</span>
              {s.events && s.events.length > 0 && (
                <span className="text-[10px] text-emerald-400 ml-1">
                  ⚽ {s.events[s.events.length - 1].player} ({s.events[s.events.length - 1].minute}&apos;)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
