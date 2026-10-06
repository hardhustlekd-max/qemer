import React, { useState } from 'react';
import { Ticket, Trash2, Copy, Check, Sparkles } from 'lucide-react';
import { AccumulatorSlip, AccaLeg } from '../core/types.js';

interface TicketSlipProps {
  slip: AccumulatorSlip | null;
  onRemoveLeg: (fixtureId: string, marketKey: string) => void;
  onClearSlip: () => void;
  onUpdateStake: (stake: number) => void;
}

function formatWireframeChoice(selection: string): string {
  if (selection.toLowerCase().includes('over 2.5')) return '2.5 Over';
  if (selection.toLowerCase().includes('under 2.5')) return '2.5 Under';
  if (selection.toLowerCase().includes('over 1.5')) return '1.5 Over';
  if (selection.toLowerCase().includes('over 3.5')) return '3.5 Over';
  if (selection.toLowerCase().includes('home win')) return 'Home Win';
  if (selection.toLowerCase().includes('away win')) return 'Away Win';
  if (selection.toLowerCase().includes('draw')) return 'Draw';
  if (selection.toLowerCase().includes('btts yes')) return 'BTTS Yes';
  if (selection.toLowerCase().includes('btts no')) return 'BTTS No';
  return selection;
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
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-lg space-y-3 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
          <Ticket className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Bet Slip is Empty</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Click &quot;Generate Accumulator&quot; or tap &quot;+&quot; on any match pick to build your slip.
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

  return (
    <div
      id="ticket-slip-container"
      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl relative overflow-hidden font-sans text-slate-900 dark:text-slate-100"
    >
      {/* Top Slip Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Ticket className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight truncate max-w-[150px] sm:max-w-[180px]">
            {slip.name}
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold shrink-0">
            {slip.legs.length} Legs
          </span>
        </div>

        <button
          id="clear-slip-btn"
          onClick={onClearSlip}
          className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors shrink-0"
          title="Clear all selections"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Wireframe Mini-Table for Slip Legs */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800/80">
        {/* Table Header */}
        <div className="grid grid-cols-12 items-center px-2 sm:px-3 py-2 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white">
          <div className="col-span-5 text-left truncate">Matches</div>
          <div className="col-span-4 text-center truncate">Choices</div>
          <div className="col-span-3 text-right truncate">Values</div>
        </div>

        {/* Slip Legs */}
        <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60">
          {slip.legs.map((leg) => {
            const choiceText = formatWireframeChoice(leg.selection);
            return (
              <div
                key={`${leg.fixtureId}_${leg.marketKey}`}
                className="grid grid-cols-12 items-center px-2 sm:px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-900/50 group gap-1"
              >
                {/* Matches */}
                <div className="col-span-5 flex flex-col min-w-0 pr-0.5">
                  <span className="font-bold text-slate-900 dark:text-white truncate text-xs leading-tight" title={leg.homeTeam}>
                    {leg.homeTeam}
                  </span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400 truncate text-xs leading-tight mt-0.5" title={leg.awayTeam}>
                    {leg.awayTeam}
                  </span>
                </div>

                {/* Choices */}
                <div className="col-span-4 text-center min-w-0 px-0.5">
                  <span className="inline-block max-w-full truncate font-bold text-xs text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {choiceText}
                  </span>
                </div>

                {/* Values & Remove Button */}
                <div className="col-span-3 flex items-center justify-end gap-1 min-w-0">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white whitespace-nowrap">
                    {leg.odds.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onRemoveLeg(leg.fixtureId, leg.marketKey)}
                    className="p-1 rounded text-slate-400 hover:text-red-500 opacity-70 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table Footer with Red Win & Total Odds */}
        <div className="grid grid-cols-12 items-center px-2 sm:px-3 py-2 bg-slate-100 dark:bg-slate-900 font-bold text-xs">
          <div className="col-span-4 text-left">
            <span className="text-red-600 dark:text-red-500 font-black uppercase tracking-wide text-xs sm:text-sm">
              Win
            </span>
          </div>
          <div className="col-span-4 text-center font-extrabold text-slate-900 dark:text-white text-xs truncate">
            Total Odds
          </div>
          <div className="col-span-4 text-right">
            <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-emerald-400 whitespace-nowrap">
              {slip.combinedOdds.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Stake & Payout Box */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Stake:</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-bold">£</span>
            <input
              type="number"
              min={1}
              value={slip.stake}
              onChange={(e) => onUpdateStake(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-16 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-right font-mono font-bold text-slate-900 dark:text-white text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Potential Payout:</span>
          <span className="font-mono text-sm font-extrabold text-cyan-600 dark:text-cyan-400">
            £{slip.potentialPayout.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Copy Summary Text Button */}
      <button
        id="copy-slip-btn"
        onClick={handleCopy}
        className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
          copied
            ? 'bg-emerald-600 border-emerald-500 text-white'
            : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-800 text-white'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-white" />
            <span>Slip Copied to Clipboard!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-slate-300" />
            <span>Copy Accumulator Summary</span>
          </>
        )}
      </button>
    </div>
  );
};

