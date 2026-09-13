import React, { useState } from 'react';
import { Ticket, Trash2, Copy, Check, TrendingUp, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { AccumulatorSlip, AccaLeg } from '../core/types.js';

interface TicketSlipProps {
  slip: AccumulatorSlip | null;
  onRemoveLeg: (fixtureId: string, marketKey: string) => void;
  onClearSlip: () => void;
  onUpdateStake: (stake: number) => void;
}

export const TicketSlip: React.FC<TicketSlipProps> = ({
  slip,
  onRemoveLeg,
  onClearSlip,
  onUpdateStake,
}) => {
  const [copied, setCopied] = useState(false);

  if (!slip || slip.legs.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 text-center shadow-lg shadow-black/30 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
          <Ticket className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Bet Slip is Empty</h4>
          <p className="text-xs text-slate-400 mt-1">
            Click &quot;Generate Accumulator&quot; or tap &quot;Add&quot; on any match market pick to start assembling your slip.
          </p>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(slip.summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRiskBadge = (risk: AccumulatorSlip['riskRating']) => {
    switch (risk) {
      case 'LOW':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">LOW RISK</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">BALANCED</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">HIGH RISK</span>;
      case 'EXTREME':
        return <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">LONGSHOT</span>;
    }
  };

  return (
    <div
      id="ticket-slip-container"
      className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-xl shadow-black/40 relative overflow-hidden"
    >
      {/* Decorative Slip Header Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

      {/* Slip Title & Actions */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-tight truncate max-w-[160px]">
            {slip.name}
          </h3>
          {getRiskBadge(slip.riskRating)}
        </div>

        <button
          id="clear-slip-btn"
          onClick={onClearSlip}
          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
          title="Clear all selections"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Leg Items List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {slip.legs.map((leg, idx) => (
          <div
            key={`${leg.fixtureId}_${leg.marketKey}`}
            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-2 text-xs group"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-slate-400 truncate">{leg.league}</span>
                <span className="font-mono font-bold text-white bg-slate-800/90 px-1.5 py-0.2 rounded text-[11px]">
                  @{leg.odds.toFixed(2)}
                </span>
              </div>
              <div className="font-bold text-white text-xs truncate">
                {leg.homeTeam} vs {leg.awayTeam}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-emerald-400 font-semibold">{leg.selection}</span>
                {leg.isPositiveEV && (
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1 rounded border border-amber-800/40">
                    +{(leg.expectedValue * 100).toFixed(0)}% EV
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => onRemoveLeg(leg.fixtureId, leg.marketKey)}
              className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors opacity-60 group-hover:opacity-100"
              title="Remove leg"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Combined Multiplied Metrics */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Total Multiplied Odds:</span>
          <span className="font-mono text-base font-bold text-emerald-400 tracking-tight">
            {slip.combinedOdds.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Combined Model Win Prob:</span>
          <span className="font-mono font-bold text-slate-200">
            {(slip.combinedProb * 100).toFixed(1)}%
          </span>
        </div>

        {slip.overallEV !== undefined && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Overall Ticket EV:</span>
            <span className={`font-mono font-bold ${slip.overallEV > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {slip.overallEV > 0 ? '+' : ''}{(slip.overallEV * 100).toFixed(1)}%
            </span>
          </div>
        )}

        {/* Dynamic Stake & Payout Simulator */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Stake:</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold">£</span>
            <input
              type="number"
              min={1}
              value={slip.stake}
              onChange={(e) => onUpdateStake(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right font-mono font-bold text-white text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-slate-300">Potential Payout:</span>
          <span className="font-mono text-base font-extrabold text-cyan-400">
            £{slip.potentialPayout.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Net Profit:</span>
          <span className="font-mono text-emerald-400 font-semibold">
            +£{slip.potentialProfit.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Copy Summary Text to Clipboard Button */}
      <button
        id="copy-slip-btn"
        onClick={handleCopy}
        className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
          copied
            ? 'bg-emerald-600 border-emerald-500 text-white'
            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-white" />
            <span>Slip Copied to Clipboard!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-slate-400" />
            <span>Copy Accumulator Summary</span>
          </>
        )}
      </button>
    </div>
  );
};
