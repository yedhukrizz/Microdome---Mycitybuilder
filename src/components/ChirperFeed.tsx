import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ChirpMessage } from '../types/city';
import { useTheme } from '../context/ThemeContext';

interface ChirperFeedProps {
  chirps: ChirpMessage[];
}

export const ChirperFeed: React.FC<ChirperFeedProps> = ({ chirps }) => {
  const { theme, undistractedMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const isLight = theme === 'light';
  const latestChirp = chirps[0];

  return (
    <div className="absolute top-11 left-1/2 -translate-x-1/2 z-20 select-none">
      {/* Chirper bird pill */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer backdrop-blur-md text-[10px] border ${
            isLight
              ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
              : 'bg-black/90 text-sky-400 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <span className="text-xs leading-none">🐦</span>
          <span className="font-semibold hidden sm:inline">Chirper</span>
          {chirps.length > 0 && (
            <span
              className={`text-[8px] font-mono font-bold px-1 rounded-full tabular-nums ${
                isLight ? 'bg-sky-600 text-white' : 'bg-neutral-800 text-neutral-200'
              }`}
            >
              {chirps.length}
            </span>
          )}
        </button>
      </div>

      {/* Floating latest chirp preview (hidden in Undistracted Mode) */}
      {!undistractedMode && !isOpen && latestChirp && (
        <div
          onClick={() => setIsOpen(true)}
          className={`mt-1 max-w-[260px] sm:max-w-xs px-2.5 py-1 rounded-lg border shadow-lg text-[10px] cursor-pointer animate-in fade-in duration-150 backdrop-blur-md ${
            isLight
              ? 'bg-white/95 border-neutral-200 text-neutral-800 hover:border-neutral-300'
              : 'bg-black/92 border-neutral-800 text-neutral-200 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center gap-1 text-[9px] truncate">
            <span className="font-semibold text-sky-500 truncate">{latestChirp.author}</span>
            <span className={isLight ? 'text-neutral-400' : 'text-neutral-600'}>·</span>
            <span className={`truncate ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
              {latestChirp.text}
            </span>
          </div>
        </div>
      )}

      {/* Expanded chirper drawer */}
      {isOpen && (
        <div
          className={`mt-1.5 w-72 sm:w-80 max-h-72 rounded-xl border shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-150 backdrop-blur-lg ${
            isLight
              ? 'bg-white border-neutral-200 text-neutral-900'
              : 'bg-neutral-950 border-neutral-800 text-neutral-100'
          }`}
        >
          <div
            className={`flex items-center justify-between px-3 py-1.5 border-b text-[11px] ${
              isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-black border-neutral-800'
            }`}
          >
            <span className="font-bold flex items-center gap-1.5">
              <span>🐦</span> Citizen Chirper Feed
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`p-0.5 rounded cursor-pointer ${
                isLight
                  ? 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 space-y-1.5 overflow-y-auto max-h-60 text-[10px]">
            {chirps.map((c) => (
              <div
                key={c.id}
                className={`p-2 rounded-lg border ${
                  isLight
                    ? 'bg-neutral-50 border-neutral-200'
                    : 'bg-neutral-900/60 border-neutral-800/80'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] mb-0.5">
                  <div className="flex items-center gap-1">
                    <span>{c.avatarEmoji}</span>
                    <span className="font-semibold">{c.author}</span>
                    <span className={isLight ? 'text-neutral-400 font-mono' : 'text-neutral-500 font-mono'}>
                      {c.handle}
                    </span>
                  </div>
                  <span className={isLight ? 'text-neutral-400' : 'text-neutral-500'}>
                    {c.timestamp}
                  </span>
                </div>
                <p className={`leading-tight pl-3.5 ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`}>
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
