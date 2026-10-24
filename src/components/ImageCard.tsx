import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { 
  Heart, 
  Download, 
  Copy, 
  Maximize2, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';
import { STYLES } from '../constants';

interface ImageCardProps {
  image: GeneratedImage;
  onSelect: (image: GeneratedImage) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onRemix: (image: GeneratedImage, e: React.MouseEvent) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onSelect,
  onToggleFavorite,
  onRemix,
}) => {
  const [copied, setCopied] = useState(false);

  const styleObj = STYLES.find((s) => s.id === image.style);

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.imageUrl;
    link.download = `tao-anh-ai-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={() => onSelect(image)}
      className="group relative rounded-2xl overflow-hidden glass-card border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-950/40 cursor-pointer flex flex-col"
    >
      {/* Image Container with matching aspect ratio */}
      <div className="relative w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        <img
          src={image.imageUrl}
          alt={image.prompt}
          referrerPolicy="no-referrer"
          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 max-h-[460px]"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-slate-200 border border-white/10 shadow">
              {styleObj?.name || image.style}
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/20 shadow">
              {image.aspectRatio}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => onToggleFavorite(image.id, e)}
            className={`p-1.5 rounded-full backdrop-blur-md transition-transform pointer-events-auto active:scale-90 ${
              image.isFavorite
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-slate-950/70 text-slate-300 hover:text-rose-400 hover:bg-slate-900 border border-white/10'
            }`}
            title={image.isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          >
            <Heart className={`w-3.5 h-3.5 ${image.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Hover Quick Actions Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <p className="text-xs text-white line-clamp-2 font-medium mb-3 leading-relaxed drop-shadow">
            {image.prompt}
          </p>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 text-xs border border-white/10 shadow transition-colors"
              title="Sao chép câu lệnh"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? 'Đã chép' : 'Chép prompt'}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => onRemix(image, e)}
                className="p-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white shadow text-xs transition-colors"
                title="Tạo biến thể mới từ ảnh này"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-white/10 shadow text-xs transition-colors"
                title="Tải ảnh về máy"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <div
                className="p-1.5 rounded-lg bg-slate-800/90 text-slate-300 border border-white/10"
                title="Xem chi tiết phóng to"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Summary */}
      <div className="p-3 bg-slate-900/40 border-t border-slate-800/60">
        <p className="text-xs text-slate-300 font-medium line-clamp-1">
          {image.prompt}
        </p>
        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
          <span>{new Date(image.createdAt).toLocaleDateString('vi-VN')}</span>
          {image.isFallback && (
            <span className="flex items-center gap-1 text-amber-400/90" title="Đồ họa nghệ thuật AI Studio">
              <Info className="w-3 h-3" />
              <span>Studio Art</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
