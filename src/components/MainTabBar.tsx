import React from 'react';

interface MainTabBarProps {
  activeTab: 'FIXTURES' | 'ACCAS' | 'TIPS';
  onSelectTab: (tab: 'FIXTURES' | 'ACCAS' | 'TIPS') => void;
}

export const MainTabBar: React.FC<MainTabBarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <div className="bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl shadow-xs shrink-0">
          <button
            id="tab-fixtures-btn"
            type="button"
            onClick={() => onSelectTab('FIXTURES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'FIXTURES'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Predictions
          </button>

          <button
            id="tab-accas-btn"
            type="button"
            onClick={() => onSelectTab('ACCAS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ACCAS'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Accumulator
          </button>

          <button
            id="tab-tips-btn"
            type="button"
            onClick={() => onSelectTab('TIPS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'TIPS'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Trends
          </button>
        </div>
      </div>
    </div>
  );
};
