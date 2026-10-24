import React from 'react';
import { STYLES } from '../constants';
import { StyleOption } from '../types';
import { 
  Camera, 
  Sparkles, 
  Zap, 
  Box, 
  Droplets, 
  Palette, 
  Flame, 
  Feather, 
  Radio, 
  Layers, 
  Check 
} from 'lucide-react';

interface StyleSelectorProps {
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Camera: <Camera className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Box: <Box className="w-4 h-4" />,
  Droplets: <Droplets className="w-4 h-4" />,
  Palette: <Palette className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  Feather: <Feather className="w-4 h-4" />,
  Radio: <Radio className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
};

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelectStyle }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-400" />
          <span>Phong cách nghệ thuật</span>
        </label>
        <span className="text-xs text-slate-400">
          Đang chọn: <span className="text-indigo-300 font-medium">{STYLES.find(s => s.id === selectedStyle)?.name || selectedStyle}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {STYLES.map((style: StyleOption) => {
          const isSelected = selectedStyle === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelectStyle(style.id)}
              className={`group relative text-left p-3 rounded-xl border transition-all duration-200 overflow-hidden ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-950/50'
                  : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              {/* Top Accent Gradient Bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${style.gradient} rounded-full mb-2.5 ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'}`} />
              
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
                  {ICON_MAP[style.iconName] || <Sparkles className="w-4 h-4" />}
                </div>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="font-semibold text-xs sm:text-sm text-slate-200 group-hover:text-white transition-colors">
                {style.name}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                {style.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
