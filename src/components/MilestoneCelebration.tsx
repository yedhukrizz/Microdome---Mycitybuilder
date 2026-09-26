import React from 'react';
import confetti from 'canvas-confetti';
import { Award, Sparkles, Check } from 'lucide-react';
import { Milestone } from '../types/city';
import { useTheme } from '../context/ThemeContext';

interface MilestoneCelebrationProps {
  milestone: Milestone;
  onDismiss: () => void;
}

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  milestone,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  React.useEffect(() => {
    // Fire confetti bursts
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    const timer = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [milestone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl p-6 text-center text-xs select-none border ${
          isLight
            ? 'bg-white border-emerald-300 text-neutral-900'
            : 'bg-neutral-950 border-emerald-500/50 text-white'
        }`}
      >
        <div
          className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
            isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          <Award className="w-9 h-9" />
        </div>

        <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-widest block mb-1">
          Milestone Achieved!
        </span>

        <h3 className="text-xl font-extrabold mb-2">
          {milestone.name}
        </h3>

        <p className={`text-xs mb-4 ${isLight ? 'text-neutral-600' : 'text-neutral-300'}`}>
          {milestone.description}
        </p>

        <div
          className={`rounded-xl p-3 mb-5 border ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          <span className={`text-[11px] block mb-1 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
            Grant Awarded to Municipal Treasury
          </span>
          <span className="text-2xl font-mono font-black text-emerald-500 tabular-nums">
            +${milestone.rewardMoney.toLocaleString()}
          </span>
        </div>

        <div
          className={`mb-6 text-left rounded-xl p-3 border ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-black/60 border-neutral-800'
          }`}
        >
          <span className={`text-[11px] font-semibold block mb-1.5 ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`}>
            Newly Unlocked Civic Infrastructure:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {milestone.unlockedFeatures.map((f, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                }`}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer text-sm"
        >
          Continue Building
        </button>
      </div>
    </div>
  );
};
