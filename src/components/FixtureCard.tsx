import React from 'react';
import { Shield, Sparkles, Info } from 'lucide-react';
import { Fixture } from '../core/types.js';

interface FixtureCardProps {
  fixture: Fixture;
  onSelectDetail: (fixture: Fixture) => void;
}

export const FixtureCard: React.FC<FixtureCardProps> = ({
  fixture,
  onSelectDetail,
}) => {
  const pred = fixture.prediction;

  // Derive highest probability prediction
  const topPredictionLabel = pred
    ? pred.homeWinProb >= pred.awayWinProb && pred.homeWinProb >= pred.drawProb
      ? `${fixture.homeTeam} Win (${Math.round(pred.homeWinProb * 100)}%)`
      : pred.awayWinProb >= pred.homeWinProb && pred.awayWinProb >= pred.drawProb
      ? `${fixture.awayTeam} Win (${Math.round(pred.awayWinProb * 100)}%)`
      : `Draw (${Math.round(pred.drawProb * 100)}%)`
    : null;

  return (
    <div
      id={`fixture-card-${fixture.id}`}
      className="bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 rounded-2xl p-4 transition-all shadow-xs hover:shadow-sm flex flex-col justify-between group"
    >
      <div>
        {/* Top bar: League, Time, Stage / Status */}
        <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-nowrap overflow-hidden">
            <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs truncate whitespace-nowrap max-w-[150px] sm:max-w-[200px]" title={fixture.stage || fixture.leagueName}>
              {fixture.stage || fixture.leagueName}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap shrink-0">
              {fixture.kickOffTime}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            {fixture.status === 'LIVE' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 shadow-2xs whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                LIVE
              </span>
            ) : fixture.status === 'FINISHED' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                FT
              </span>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-500 whitespace-nowrap">
                {fixture.matchDate}
              </span>
            )}
          </div>
        </div>

        {/* Teams & Expected Goals Display */}
        <div className="grid grid-cols-12 items-center gap-2 my-2">
          {/* Home Team */}
          <div className="col-span-5 flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
              {fixture.homeBadge && (
                <img
                  src={fixture.homeBadge}
                  alt=""
                  className="w-4 h-4 object-contain shrink-0 rounded-full"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              )}
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate whitespace-nowrap" title={fixture.homeTeam}>
                {fixture.homeTeam}
              </span>
              {pred?.homeWinProb !== undefined && (
                <span className="font-mono text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0 whitespace-nowrap" title={`${fixture.homeTeam} Win: ${Math.round(pred.homeWinProb * 100)}%`}>
                  {Math.round(pred.homeWinProb * 100)}%
                </span>
              )}
            </div>
            {pred && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap shrink-0">
                xG: <strong className="text-emerald-600 dark:text-emerald-400">{pred.homeXG}</strong>
              </span>
            )}
          </div>

          {/* VS Divider or Match Score */}
          <div className="col-span-2 flex flex-col items-center justify-center shrink-0">
            {fixture.score && fixture.score.home !== undefined ? (
              <span className="text-xs sm:text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                {fixture.score.home}:{fixture.score.away}
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">VS</span>
            )}
            <button
              onClick={() => onSelectDetail(fixture)}
              className="mt-0.5 text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="View Poisson probability matrix"
            >
              <Info className="w-3 h-3" />
              <span>Grid</span>
            </button>
          </div>

          {/* Away Team */}
          <div className="col-span-5 flex flex-col items-end text-right min-w-0">
            <div className="flex items-center justify-end gap-1.5 min-w-0 flex-nowrap w-full">
              {pred?.awayWinProb !== undefined && (
                <span className="font-mono text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-950 text-cyan-600 dark:text-cyan-400 shadow-xs shrink-0 whitespace-nowrap" title={`${fixture.awayTeam} Win: ${Math.round(pred.awayWinProb * 100)}%`}>
                  {Math.round(pred.awayWinProb * 100)}%
                </span>
              )}
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate whitespace-nowrap" title={fixture.awayTeam}>
                {fixture.awayTeam}
              </span>
              {fixture.awayBadge && (
                <img
                  src={fixture.awayBadge}
                  alt=""
                  className="w-4 h-4 object-contain shrink-0 rounded-full"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              )}
            </div>
            {pred && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap shrink-0">
                xG: <strong className="text-cyan-600 dark:text-cyan-400">{pred.awayXG}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Extra Result Details from Scraper (regulation or penalties) */}
        {fixture.resultDetails && (fixture.resultDetails.regulationTime || fixture.resultDetails.penalties) && (
          <div className="text-center font-mono text-[10px] text-slate-500 dark:text-slate-400 py-0.5">
            {fixture.resultDetails.regulationTime && <span>Reg: {fixture.resultDetails.regulationTime} </span>}
            {fixture.resultDetails.penalties && <span className="font-bold text-emerald-600 dark:text-emerald-400">(Pen: {fixture.resultDetails.penalties})</span>}
          </div>
        )}

        {/* Probability Bar Indicator */}
        {pred && (
          <div className="my-2.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{(pred.homeWinProb * 100).toFixed(0)}%</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{(pred.drawProb * 100).toFixed(0)}%</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">{(pred.awayWinProb * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full flex overflow-hidden">
              <div
                style={{ width: `${pred.homeWinProb * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Home Win: ${(pred.homeWinProb * 100).toFixed(1)}%`}
              />
              <div
                style={{ width: `${pred.drawProb * 100}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Draw: ${(pred.drawProb * 100).toFixed(1)}%`}
              />
              <div
                style={{ width: `${pred.awayWinProb * 100}%` }}
                className="bg-cyan-500 transition-all duration-500"
                title={`Away Win: ${(pred.awayWinProb * 100).toFixed(1)}%`}
              />
            </div>
          </div>
        )}

        {/* Highest Predicted Outcome */}
        {topPredictionLabel && (
          <div className="mt-2 mb-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs shadow-xs min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 truncate flex-nowrap w-full">
              <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 whitespace-nowrap">Predicted Outcome:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate whitespace-nowrap">{topPredictionLabel}</span>
            </div>
          </div>
        )}
      </div>

      {/* 1X2 Probabilities Selection Grid */}
      {pred && (
        <div className="grid grid-cols-3 gap-1.5 pt-1.5">
          <button
            type="button"
            onClick={() => onSelectDetail(fixture)}
            className="p-1.5 rounded-xl text-center bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs whitespace-nowrap"
          >
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium whitespace-nowrap">Home</span>
            <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              {Math.round(pred.homeWinProb * 100)}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectDetail(fixture)}
            className="p-1.5 rounded-xl text-center bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs whitespace-nowrap"
          >
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium whitespace-nowrap">Draw</span>
            <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
              {Math.round(pred.drawProb * 100)}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectDetail(fixture)}
            className="p-1.5 rounded-xl text-center bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs whitespace-nowrap"
          >
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium whitespace-nowrap">Away</span>
            <span className="font-mono font-bold text-xs text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
              {Math.round(pred.awayWinProb * 100)}%
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
