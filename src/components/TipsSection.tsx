import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
  Flame,
  ShieldCheck,
  TrendingUp,
  Newspaper,
  Activity,
  Calendar,
  Layers,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { TrendingTipsData, FootballTipItem, GroundingSource, AccaLeg } from '../core/types.js';

interface TipsSectionProps {
  tipsData: TrendingTipsData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onAddLegToSlip?: (leg: AccaLeg) => void;
}

export const TipsSection: React.FC<TipsSectionProps> = ({
  tipsData,
  isLoading,
  isRefreshing,
  onRefresh,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'HEADLINE' | 'MATCH_PREVIEW' | 'BETTING_TIP' | 'INJURY_TEAM_NEWS' | 'RAW_MARKDOWN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 min ago';
      if (diffMins < 60) return `${diffMins} mins ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    } catch {
      return 'Today';
    }
  };

  const filteredTips = (tipsData?.tips || []).filter((item) => {
    if (selectedCategory !== 'ALL' && selectedCategory !== 'RAW_MARKDOWN') {
      if (item.category !== selectedCategory) return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchText = `${item.title} ${item.analysis} ${item.match || ''} ${item.league || ''} ${item.predictionOrTip || ''}`.toLowerCase();
      return matchText.includes(q);
    }
    return true;
  });

  const getCategoryBadge = (category: FootballTipItem['category']) => {
    switch (category) {
      case 'HEADLINE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <Newspaper className="w-3 h-3" />
            Headline
          </span>
        );
      case 'MATCH_PREVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Activity className="w-3 h-3" />
            Match Preview
          </span>
        );
      case 'BETTING_TIP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <TrendingUp className="w-3 h-3" />
            Betting Tip
          </span>
        );
      case 'INJURY_TEAM_NEWS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertCircle className="w-3 h-3" />
            Team News
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-sans animate-in fade-in duration-200">
      {/* Top Banner Card with Search Grounding Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-700 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                <span>Today&apos;s Trending Tips &amp; Headlines</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">
                <Search className="w-3 h-3 text-sky-400" />
                <span>Google Search Grounded</span>
              </div>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Live Football Intelligence &amp; Value Analysis
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl line-clamp-2">
              {tipsData?.headlineSummary || "Real-time football news, tactical breakdowns, team news, and market value predictions powered by Google Search grounding."}
            </p>
            {tipsData?.quotaNotice && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-medium mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>{tipsData.quotaNotice}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 block font-medium">Last Grounded</span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {formatTimeAgo(tipsData?.lastUpdated)}
              </span>
            </div>
            <button
              onClick={onRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              title="Refresh analysis with Google Search Grounding"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Grounding...' : 'Fetch Live Trends'}</span>
            </button>
          </div>
        </div>

        {/* Grounding Web Citations Strip */}
        {tipsData?.groundingSources && tipsData.groundingSources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-700/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Verified Web Sources:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-w-full">
              {tipsData.groundingSources.slice(0, 6).map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/90 hover:bg-slate-700 border border-slate-600/70 text-[11px] text-slate-200 hover:text-white transition-colors truncate max-w-[180px]"
                  title={src.title}
                >
                  <span className="truncate">{src.title}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <div className="bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-xs space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Categories Pill Switcher */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              All Items ({tipsData?.tips?.length || 0})
            </button>
            <button
              onClick={() => setSelectedCategory('BETTING_TIP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'BETTING_TIP'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              🎯 Betting Tips
            </button>
            <button
              onClick={() => setSelectedCategory('MATCH_PREVIEW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'MATCH_PREVIEW'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              ⚽ Match Previews
            </button>
            <button
              onClick={() => setSelectedCategory('HEADLINE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'HEADLINE'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              📰 Top Headlines
            </button>
            <button
              onClick={() => setSelectedCategory('INJURY_TEAM_NEWS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'INJURY_TEAM_NEWS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              🏥 Team News
            </button>
            <button
              onClick={() => setSelectedCategory('RAW_MARKDOWN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'RAW_MARKDOWN'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              📄 Full Grounded Dossier
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search analysis, teams, tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none truncate font-medium"
            />
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-800 rounded-2xl p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" />
        </div>
      ) : selectedCategory === 'RAW_MARKDOWN' ? (
        /* Full Markdown View */
        <div className="bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Comprehensive Grounded Intelligence Report
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Live Google Search Grounding Output
            </span>
          </div>

          <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed space-y-3">
            {tipsData?.rawAnalysisMarkdown || "No raw analysis available."}
          </div>
        </div>
      ) : filteredTips.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-800 rounded-2xl">
          <Layers className="w-7 h-7 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">No tips found for this category or filter</p>
          <p className="text-xs text-slate-500 mt-1">
            Try switching to &quot;All Items&quot; or clearing your search term.
          </p>
        </div>
      ) : (
        /* Grid of Structured Tip Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTips.map((tip) => (
            <div
              key={tip.id}
              className="bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                {/* Header with Category & League */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {getCategoryBadge(tip.category)}
                    {tip.league && (
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {tip.league}
                      </span>
                    )}
                  </div>
                  {tip.confidenceOrOdds && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 shrink-0">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {tip.confidenceOrOdds}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {tip.title}
                </h4>

                {/* Match Highlight Tag */}
                {tip.match && (
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="truncate">⚽ {tip.match}</span>
                  </div>
                )}

                {/* Prediction / Value Tip Highlight */}
                {tip.predictionOrTip && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Recommended Pick / Angle</span>
                    </div>
                    <div className="font-extrabold text-slate-900 dark:text-emerald-200 mt-0.5">
                      {tip.predictionOrTip}
                    </div>
                  </div>
                )}

                {/* Analysis Body */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                  {tip.analysis}
                </p>
              </div>

              {/* Footer with Source Link */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                {tip.sourceUrl ? (
                  <a
                    href={tip.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate max-w-[240px]"
                    title={tip.sourceTitle || 'View Source'}
                  >
                    <Search className="w-2.5 h-2.5 shrink-0 text-sky-500" />
                    <span className="truncate">{tip.sourceTitle || 'Google Search Source'}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">Google Search Grounded</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sources Grid List Footer */}
      {tipsData?.groundingSources && tipsData.groundingSources.length > 0 && (
        <div className="bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Google Search Grounding Citations &amp; Reference Articles</span>
          </div>
          <p className="text-[11px] text-slate-500">
            The news, form guides, and odds analysis above were verified with real-time Google Search results:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {tipsData.groundingSources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
              >
                <span className="truncate font-medium text-[11px]">{source.title}</span>
                <ExternalLink className="w-3 h-3 shrink-0 text-slate-400 group-hover:text-emerald-500" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
