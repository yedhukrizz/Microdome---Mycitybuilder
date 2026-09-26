import React from 'react';
import { X, CheckCircle2, Lock, Award } from 'lucide-react';
import { Milestone } from '../types/city';
import { useTheme } from '../context/ThemeContext';

interface MilestonesModalProps {
  milestones: Milestone[];
  currentPopulation: number;
  onClose: () => void;
}

export const MilestonesModal: React.FC<MilestonesModalProps> = ({
  milestones,
  currentPopulation,
  onClose,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-xs select-none border ${
          isLight
            ? 'bg-white border-neutral-200 text-neutral-900'
            : 'bg-neutral-950 border-neutral-800 text-neutral-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-black/70 border-neutral-800'
          }`}
        >
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              City Milestones & Progression
            </h2>
            <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>
              Current Citizens: <span className="font-mono font-semibold tabular-nums">{currentPopulation.toLocaleString()}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900'
                : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Milestone List */}
        <div className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {milestones.map((m, idx) => {
            const isReached = currentPopulation >= m.populationRequired || m.achieved;
            const progress = Math.min(100, Math.round((currentPopulation / m.populationRequired) * 100));

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all ${
                  isReached
                    ? isLight
                      ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                      : 'bg-emerald-950/30 border-emerald-800/60 shadow-xs'
                    : isLight
                    ? 'bg-neutral-50 border-neutral-200 opacity-80'
                    : 'bg-neutral-900/40 border-neutral-800/80 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isReached
                          ? isLight
                            ? 'bg-emerald-200 text-emerald-800'
                            : 'bg-emerald-500/20 text-emerald-400'
                          : isLight
                          ? 'bg-neutral-200 text-neutral-500'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {isReached ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                          Stage 0{idx + 1}
                        </span>
                        <span className={isLight ? 'text-neutral-300' : 'text-neutral-700'}>·</span>
                        <h4 className="text-sm font-bold">{m.name}</h4>
                      </div>
                      <p className={`text-xs mt-0.5 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        {m.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-500 block tabular-nums">
                      +${m.rewardMoney.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-mono tabular-nums ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      Goal: {m.populationRequired.toLocaleString()} pop
                    </span>
                  </div>
                </div>

                {/* Unlocks bar */}
                <div
                  className={`mt-3 pt-3 border-t flex items-center justify-between text-[11px] ${
                    isLight ? 'border-neutral-200' : 'border-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isLight ? 'text-neutral-500' : 'text-neutral-500'}`}>Unlocks:</span>
                    {m.unlockedFeatures.map((f, i) => (
                      <span key={i} className={isLight ? 'text-neutral-700 font-medium' : 'text-neutral-300 font-medium'}>
                        {f}{i < m.unlockedFeatures.length - 1 ? ' ·' : ''}
                      </span>
                    ))}
                  </div>

                  {!isReached && (
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>{progress}%</span>
                      <div className={`w-20 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-neutral-200' : 'bg-neutral-800'}`}>
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
