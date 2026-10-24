import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { ImageCard } from './ImageCard';
import { 
  Heart, 
  Search, 
  Trash2, 
  Image as ImageIcon, 
  Filter, 
  Sparkles,
  Download
} from 'lucide-react';
import { STYLES } from '../constants';

interface HistoryGalleryProps {
  history: GeneratedImage[];
  onSelectImage: (image: GeneratedImage) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onRemix: (image: GeneratedImage, e: React.MouseEvent) => void;
  onClearHistory: () => void;
  onGoToStudio: () => void;
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({
  history,
  onSelectImage,
  onToggleFavorite,
  onRemix,
  onClearHistory,
  onGoToStudio,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');
  const [styleFilter, setStyleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = history.filter((img) => {
    if (filterMode === 'favorites' && !img.isFavorite) return false;
    if (styleFilter !== 'all' && img.style !== styleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return img.prompt.toLowerCase().includes(q) || (img.enhancedPrompt && img.enhancedPrompt.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>Bộ sưu tập sáng tạo của bạn</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {history.length} tác phẩm
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quản lý, tải về và tạo biến thể mới từ các tác phẩm bạn đã tạo
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-white hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa toàn bộ lịch sử</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo từ khóa câu lệnh..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/80 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Tab Filter: All vs Favorites */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('favorites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterMode === 'favorites'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <Heart className="w-3 h-3 fill-current" />
            <span>Yêu thích ({history.filter((h) => h.isFavorite).length})</span>
          </button>
        </div>

        {/* Style Dropdown Filter */}
        <select
          value={styleFilter}
          onChange={(e) => setStyleFilter(e.target.value)}
          aria-label="Lọc theo phong cách nghệ thuật"
          className="bg-slate-900 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Mọi phong cách</option>
          {STYLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid of Images */}
      {filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredHistory.map((item) => (
            <ImageCard
              key={item.id}
              image={item}
              onSelect={onSelectImage}
              onToggleFavorite={onToggleFavorite}
              onRemix={onRemix}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-slate-900/30 border border-slate-800/80 flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="text-lg font-bold text-white">Chưa có tác phẩm nào</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            {searchQuery || filterMode === 'favorites'
              ? 'Không tìm thấy hình ảnh phù hợp với tiêu chí lọc.'
              : 'Hãy bắt đầu tạo những hình ảnh đầu tiên của bạn bằng cách nhập mô tả ở Phòng Tạo Ảnh.'}
          </p>
          <button
            type="button"
            onClick={onGoToStudio}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 hover:brightness-110 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tạo ảnh mới ngay</span>
          </button>
        </div>
      )}
    </div>
  );
};
