import React from 'react';
import { X, Zap, Droplets, Smile, DollarSign, Users, Briefcase, Trash2, ArrowUpCircle } from 'lucide-react';
import { CellData } from '../types/city';
import { useTheme } from '../context/ThemeContext';

interface InspectorModalProps {
  cell: CellData;
  onClose: () => void;
  onBulldoze: (x: number, z: number) => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  cell,
  onClose,
  onBulldoze,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const b = cell.building;
  const s = cell.service;
  const r = cell.road;

  return (
    <div
      className={`absolute top-11 right-2 sm:right-14 z-30 w-64 rounded-xl border shadow-2xl p-3 text-[11px] select-none animate-in fade-in slide-in-from-right-1 duration-150 backdrop-blur-md ${
        isLight
          ? 'bg-white/95 border-neutral-200 text-neutral-900'
          : 'bg-black/92 border-neutral-800 text-white'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-2 mb-2 ${isLight ? 'border-neutral-200' : 'border-neutral-800'}`}>
        <div>
          <span className={`text-[9px] font-mono uppercase tracking-wider block ${isLight ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Tile [{cell.x}, {cell.z}]
          </span>
          <h3 className="text-xs font-bold leading-tight truncate max-w-[180px]">
            {b
              ? b.name
              : s
              ? s.name
              : r
              ? `${r.type.replace('_', ' ').toUpperCase()} ROAD`
              : `${cell.terrain.toUpperCase()} TILE`}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`p-1 rounded transition-colors cursor-pointer ${
            isLight
              ? 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900'
              : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Building Details */}
      {b && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>Zone</span>
            <div className="flex items-center gap-1 font-medium capitalize">
              <span>{b.zone}</span>
              <span className={isLight ? 'text-neutral-300' : 'text-neutral-700'}>·</span>
              <span className="font-mono text-emerald-500 font-semibold">Lvl {b.level}/5</span>
            </div>
          </div>

          {b.constructionProgress < 1.0 && (
            <div
              className={`border rounded p-1.5 flex items-center justify-between text-[10px] ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
              }`}
            >
              <span className="flex items-center gap-1 font-medium">
                <ArrowUpCircle className="w-3 h-3 text-amber-500" /> Building
              </span>
              <span className="font-mono font-bold">
                {Math.round(b.constructionProgress * 100)}%
              </span>
            </div>
          )}

          {b.isAbandoned && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded p-1.5 text-[10px] font-medium leading-tight">
              ⚠️ Abandoned due to lack of utilities or jobs. Fix utilities to welcome residents back!
            </div>
          )}

          {/* Occupancy / Employment stats */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {b.zone === 'residential' ? (
              <div className={`p-1.5 rounded border ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'}`}>
                <span className={`block text-[9px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>Residents</span>
                <span className="font-mono font-bold text-xs text-emerald-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {b.residents} / {b.maxResidents}
                </span>
              </div>
            ) : (
              <div className={`p-1.5 rounded border ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'}`}>
                <span className={`block text-[9px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>Workers</span>
                <span className="font-mono font-bold text-xs text-sky-500 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {b.workers} / {b.maxWorkers}
                </span>
              </div>
            )}

            <div className={`p-1.5 rounded border ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'}`}>
              <span className={`block text-[9px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>Weekly Tax</span>
              <span className="font-mono font-bold text-xs text-emerald-500 flex items-center gap-0.5">
                <DollarSign className="w-3 h-3" />
                ${b.taxIncome}
              </span>
            </div>
          </div>

          {/* Utilities Status Check */}
          <div className={`pt-1 border-t space-y-1 ${isLight ? 'border-neutral-200' : 'border-neutral-800'}`}>
            <div className="flex items-center justify-between text-[10px]">
              <span className={`flex items-center gap-1 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                <Zap className="w-3 h-3 text-yellow-500" /> Power
              </span>
              <span
                className={`font-semibold ${
                  b.hasPower ? 'text-emerald-500' : 'text-rose-500 animate-pulse'
                }`}
              >
                {b.hasPower ? 'Connected' : 'No Power'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span className={`flex items-center gap-1 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                <Droplets className="w-3 h-3 text-sky-500" /> Water
              </span>
              <span
                className={`font-semibold ${
                  b.hasWater ? 'text-emerald-500' : 'text-rose-500 animate-pulse'
                }`}
              >
                {b.hasWater ? 'Connected' : 'No Water'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Service Details */}
      {s && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>Service Type</span>
            <span className="font-semibold capitalize text-emerald-500">
              {s.type.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <div className={`p-1.5 rounded border ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'}`}>
              <span className={`block text-[9px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>Weekly Upkeep</span>
              <span className="font-mono font-bold text-xs text-rose-500">
                -${s.maintenanceCost}
              </span>
            </div>

            <div className={`p-1.5 rounded border ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'}`}>
              <span className={`block text-[9px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>Coverage Area</span>
              <span className="font-mono font-bold text-xs text-sky-500">
                {s.coverageRadius} tiles
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Road Details */}
      {r && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>Road Classification</span>
            <span className="font-semibold capitalize text-sky-500">
              {r.type.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>Highway Connected</span>
            <span className={`font-semibold ${r.isHighwayGateway ? 'text-emerald-500' : 'text-amber-500'}`}>
              {r.isHighwayGateway ? 'Yes · Regional Gateway' : 'Local Network'}
            </span>
          </div>
        </div>
      )}

      {/* Demolish button */}
      {(b || s || r) && (
        <button
          type="button"
          onClick={() => onBulldoze(cell.x, cell.z)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold transition-colors cursor-pointer text-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Demolish Structure</span>
        </button>
      )}
    </div>
  );
};
