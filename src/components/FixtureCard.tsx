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
  const bestValue = fixture.bestValueMarket;

  const homeWinMarket = fixture.markets?.find((m) => m.key === 'HOME_WIN');
  const drawMarket = fixture.markets?.find((m) => m.key === 'DRAW');
  const awayWinMarket = fixture.markets?.find((m) => m.key === 'AWAY_WIN');

  return (
    <div
      id={`fixture-card-${fixture.id}`}
      className="bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 rounded-2xl p-4 transition-all shadow-xs hover:shadow-sm flex flex-col justify-between group"
    >
      <div>
        {/* Top bar: League, Time, Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs">
              {fixture.leagueName}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {fixture.kickOffTime}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {bestValue && bestValue.isPositiveEV && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-2xs">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                +{(bestValue.expectedValue * 100).toFixed(1)}% EV
              </span>
            )}
            {bestValue && bestValue.isBanker && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-2xs">
                <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Banker
              </span>
            )}
          </div>
        </div>

        {/* Teams & Expected Goals Display */}
        <div className="grid grid-cols-12 items-center gap-2 my-2">
          {/* Home Team */}
          <div className="col-span-5 flex flex-col">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate" title={fixture.homeTeam}>
                {fixture.homeTeam}
              </span>
              {pred?.homeWinProb !== undefined && (
                <span className="font-mono text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0" title={`${fixture.homeTeam} Win Probability: ${Math.round(pred.homeWinProb * 100)}%`}>
                  {Math.round(pred.homeWinProb * 100)}%
                </span>
              )}
            </div>
            {pred && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                xG: <strong className="text-emerald-600 dark:text-emerald-400">{pred.homeXG}</strong>
              </span>
            )}
          </div>

          {/* VS Divider or Match Score */}
          <div className="col-span-2 flex flex-col items-center justify-center">
            {fixture.score && fixture.score.home !== undefined ? (
              <span className="text-xs sm:text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {fixture.score.home}:{fixture.score.away}
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">VS</span>
            )}
            <button
              onClick={() => onSelectDetail(fixture)}
              className="mt-0.5 text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 transition-colors cursor-pointer"
              title="View Poisson probability matrix"
            >
              <Info className="w-3 h-3" />
              <span>Grid</span>
            </button>
          </div>

          {/* Away Team */}
          <div className="col-span-5 flex flex-col items-end text-right">
            <div className="flex items-center justify-end gap-1.5 min-w-0">
              {pred?.awayWinProb !== undefined && (
                <span className="font-mono text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-950 text-cyan-600 dark:text-cyan-400 shadow-xs shrink-0" title={`${fixture.awayTeam} Win Probability: ${Math.round(pred.awayWinProb * 100)}%`}>
                  {Math.round(pred.awayWinProb * 100)}%
                </span>
              )}
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate" title={fixture.awayTeam}>
                {fixture.awayTeam}
              </span>
            </div>
            {pred && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                xG: <strong className="text-cyan-600 dark:text-cyan-400">{pred.awayXG}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Probability Bar Indicator */}
        {pred && (
          <div className="my-3 space-y-1">
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

        {/* Best Value Pick Recommendation */}
        {bestValue && (
          <div className="mt-2.5 mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[10px] font-bold uppercase text-slate-400">Top Value Pick:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{bestValue.name}</span>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-950 px-2.5 py-0.5 rounded-lg text-[11px] shadow-xs">
              @{bestValue.odds.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Bookmaker Odds 1X2 Info */}
      <div className="grid grid-cols-3 gap-1.5 pt-2">
        {/* Home Win */}
        {homeWinMarket && (
          <button
            type="button"
            onClick={() => onSelectDetail(fixture)}
            className={`p-2 rounded-xl text-center transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs ${
              homeWinMarket.isPositiveEV
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-slate-200'
                : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300'
            }`}
          >
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Home</span>
            <span className="font-mono font-bold text-xs">{homeWinMarket.odds.toFixed(2)}</span>
            {homeWinMarket.isPositiveEV && (
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                +{(homeWinMarket.expectedValue * 100).toFixed(0)}% EV
              </span>
            )}
          </button>
        )}

        {/* Draw */}
        {drawMarket && (
          <button
            type="button"
            onClick={() => onSelectDetail(fixture)}
            className={`p-2 rounded-xl text-center transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs ${
              drawMarket.isPositiveEV
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-slate-200'
                : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300'
            }`}
          >
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Draw</span>
            <span className="font-mono font-bold text-xs">{drawMarket.odds.toFixed(2)}</span>
            {drawMarket.isPositiveEV && (
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                +{(drawMarket.expectedValue * 100).toFixed(0)}% EV
              </span>
            )}
          </button>
        )}

        {/* Away Win */}
        {awayWinMarket && (
          <button
            type="button"
            onClick={() => onSelectDetail(fixture)}
            className={`p-2 rounded-xl text-center transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs ${
              awayWinMarket.isPositiveEV
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-slate-200'
                : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300'
            }`}
          >
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Away</span>
            <span className="font-mono font-bold text-xs">{awayWinMarket.odds.toFixed(2)}</span>
            {awayWinMarket.isPositiveEV && (
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                +{(awayWinMarket.expectedValue * 100).toFixed(0)}% EV
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
