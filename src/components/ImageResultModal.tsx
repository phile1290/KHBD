import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Heart, 
  Maximize, 
  Minimize, 
  Share2, 
  Trash2,
  Calendar,
  Layers,
  Wand2
} from 'lucide-react';
import { STYLES } from '../constants';

interface ImageResultModalProps {
  image: GeneratedImage | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onRemix: (image: GeneratedImage) => void;
  onUseAsSource: (image: GeneratedImage) => void;
}

export const ImageResultModal: React.FC<ImageResultModalProps> = ({
  image,
  onClose,
  onToggleFavorite,
  onDelete,
  onRemix,
  onUseAsSource,
}) => {
  if (!image) return null;

  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const styleObj = STYLES.find((s) => s.id === image.style);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.imageUrl;
    link.download = `tao-anh-ai-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/70 hover:bg-slate-950 text-slate-300 hover:text-white border border-white/10 transition-colors shadow-lg"
          title="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Large Image Viewport */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 sm:p-8 relative min-h-[300px] overflow-hidden">
          <div className="relative max-h-full max-w-full flex items-center justify-center">
            <img
              src={image.imageUrl}
              alt={image.prompt}
              referrerPolicy="no-referrer"
              className={`max-h-[70vh] w-auto object-contain rounded-xl shadow-2xl transition-transform duration-300 ${
                isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            />

            {/* Zoom toggle floating button */}
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className="absolute bottom-3 right-3 p-2 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-white/10 backdrop-blur shadow text-xs flex items-center gap-1.5"
            >
              {isZoomed ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              <span>{isZoomed ? 'Thu nhỏ' : 'Phóng to'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Metadata and Actions Sidebar */}
        <div className="w-full md:w-96 p-5 sm:p-6 flex flex-col justify-between bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 overflow-y-auto">
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Chi tiết tác phẩm AI
              </span>
              <button
                type="button"
                onClick={() => onToggleFavorite(image.id)}
                className={`p-2 rounded-xl transition-all border ${
                  image.isFavorite
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-rose-400 border-slate-700'
                }`}
                title={image.isFavorite ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
              >
                <Heart className={`w-4 h-4 ${image.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Prompt details */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Câu lệnh (Prompt)
              </label>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-200 leading-relaxed font-normal">
                {image.prompt}
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 px-2 rounded-lg hover:bg-indigo-950/40 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép vào bộ nhớ!' : 'Sao chép prompt'}</span>
                </button>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Phong cách
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {styleObj?.name || image.style}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                  <Maximize className="w-3.5 h-3.5 text-indigo-400" />
                  Tỉ lệ khung hình
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {image.aspectRatio}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Ngày tạo
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {new Date(image.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  Chế độ
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {image.sourceMode === 'sketch'
                    ? 'Phác thảo tay'
                    : image.sourceMode === 'image'
                    ? 'Ảnh thành ảnh'
                    : 'Chữ thành ảnh'}
                </span>
              </div>
            </div>

            {/* Notice if fallback */}
            {image.notice && (
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-xs leading-relaxed">
                {image.notice}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-6 border-t border-slate-800/80">
            {/* Download Primary */}
            <button
              type="button"
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Tải ảnh độ nét cao (PNG)</span>
            </button>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onRemix(image);
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Tải lại câu lệnh và phong cách để tạo biến thể mới"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Tạo biến thể mới</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUseAsSource(image);
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Sử dụng ảnh này làm đầu vào để biến đổi tiếp"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Remix ảnh này</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 py-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Đã sao chép liên kết!' : 'Chia sẻ studio'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi lịch sử?')) {
                    onDelete(image.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 py-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa ảnh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
