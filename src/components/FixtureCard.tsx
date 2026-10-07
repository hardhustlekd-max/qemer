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
      className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-4.5 transition-all shadow-md shadow-black/20 flex flex-col justify-between group"
    >
      <div>
        {/* Top bar: League, Time, Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
              {fixture.leagueName}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {fixture.kickOffTime}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {bestValue && bestValue.isPositiveEV && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                <Sparkles className="w-3 h-3" />
                +{(bestValue.expectedValue * 100).toFixed(1)}% EV
              </span>
            )}
            {bestValue && bestValue.isBanker && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
                <Shield className="w-3 h-3" />
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
              <span className="text-sm font-bold text-white tracking-tight truncate" title={fixture.homeTeam}>
                {fixture.homeTeam}
              </span>
              {pred?.homeWinProb !== undefined && (
                <span className="font-mono text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-950/70 text-emerald-400 border border-emerald-800 shrink-0" title={`${fixture.homeTeam} Win Probability: ${Math.round(pred.homeWinProb * 100)}%`}>
                  {Math.round(pred.homeWinProb * 100)}%
                </span>
              )}
            </div>
            {pred && (
              <span className="text-[11px] text-slate-400 font-mono">
                xG: <strong className="text-emerald-400">{pred.homeXG}</strong>
              </span>
            )}
          </div>

          {/* VS Divider & Probabilities */}
          <div className="col-span-2 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">VS</span>
            <button
              onClick={() => onSelectDetail(fixture)}
              className="mt-0.5 text-[10px] text-slate-400 hover:text-cyan-400 flex items-center gap-0.5 transition-colors cursor-pointer"
              title="View Poisson probability matrix & team radar"
            >
              <Info className="w-3 h-3" />
              <span>Grid</span>
            </button>
          </div>

          {/* Away Team */}
          <div className="col-span-5 flex flex-col items-end text-right">
            <div className="flex items-center justify-end gap-1.5 min-w-0">
              {pred?.awayWinProb !== undefined && (
                <span className="font-mono text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-950/70 text-cyan-400 border border-cyan-800 shrink-0" title={`${fixture.awayTeam} Win Probability: ${Math.round(pred.awayWinProb * 100)}%`}>
                  {Math.round(pred.awayWinProb * 100)}%
                </span>
              )}
              <span className="text-sm font-bold text-white tracking-tight truncate" title={fixture.awayTeam}>
                {fixture.awayTeam}
              </span>
            </div>
            {pred && (
              <span className="text-[11px] text-slate-400 font-mono">
                xG: <strong className="text-cyan-400">{pred.awayXG}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Probability Bar Indicator */}
        {pred && (
          <div className="my-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">{(pred.homeWinProb * 100).toFixed(0)}%</span>
              <span className="text-amber-400 font-bold">{(pred.drawProb * 100).toFixed(0)}%</span>
              <span className="text-cyan-400 font-bold">{(pred.awayWinProb * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
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
          <div className="mt-2.5 mb-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[10px] font-bold uppercase text-slate-400">Top Value Pick:</span>
              <span className="font-semibold text-slate-200 truncate">{bestValue.name}</span>
            </div>
            <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700">
              @{bestValue.odds.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Bookmaker Odds 1X2 Info */}
      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/60">
        {/* Home Win */}
        {homeWinMarket && (
          <button
            type="button"
            onClick={() => onSelectDetail(fixture)}
            className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
              homeWinMarket.isPositiveEV
                ? 'bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-800/50 text-slate-200'
                : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <span className="text-[10px] text-slate-400 uppercase font-medium">1 (Home)</span>
            <span className="font-mono font-bold text-xs">{homeWinMarket.odds.toFixed(2)}</span>
            {homeWinMarket.isPositiveEV && (
              <span className="text-[9px] text-emerald-400 font-bold">
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
            className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
              drawMarket.isPositiveEV
                ? 'bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-800/50 text-slate-200'
                : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <span className="text-[10px] text-slate-400 uppercase font-medium">X (Draw)</span>
            <span className="font-mono font-bold text-xs">{drawMarket.odds.toFixed(2)}</span>
            {drawMarket.isPositiveEV && (
              <span className="text-[9px] text-emerald-400 font-bold">
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
            className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
              awayWinMarket.isPositiveEV
                ? 'bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-800/50 text-slate-200'
                : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <span className="text-[10px] text-slate-400 uppercase font-medium">2 (Away)</span>
            <span className="font-mono font-bold text-xs">{awayWinMarket.odds.toFixed(2)}</span>
            {awayWinMarket.isPositiveEV && (
              <span className="text-[9px] text-emerald-400 font-bold">
                +{(awayWinMarket.expectedValue * 100).toFixed(0)}% EV
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
