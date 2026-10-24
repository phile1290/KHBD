import React from 'react';
import { ASPECT_RATIOS } from '../constants';
import { AspectRatioOption } from '../types';
import { Maximize2 } from 'lucide-react';

interface RatioSelectorProps {
  selectedRatio: string;
  onSelectRatio: (ratio: string) => void;
}

export const RatioSelector: React.FC<RatioSelectorProps> = ({ selectedRatio, onSelectRatio }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-indigo-400" />
          <span>Tỉ lệ khung hình</span>
        </label>
        <span className="text-xs text-slate-400">
          Đang chọn: <span className="text-indigo-300 font-medium">{selectedRatio}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {ASPECT_RATIOS.map((item: AspectRatioOption) => {
          const isSelected = selectedRatio === item.ratio;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectRatio(item.ratio)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/50 text-white'
                  : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {/* Visual shape representation */}
              <div className="h-9 flex items-center justify-center mb-2">
                <div
                  className={`border-2 rounded transition-all ${
                    isSelected ? 'border-indigo-400 bg-indigo-500/20' : 'border-slate-600 bg-slate-800/40'
                  }`}
                  style={{
                    width: `${Math.min(item.widthRatio * 16, 32)}px`,
                    height: `${Math.min(item.heightRatio * 16, 32)}px`,
                  }}
                />
              </div>

              <div className="text-xs font-semibold">{item.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{item.description.split(',')[0]}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
