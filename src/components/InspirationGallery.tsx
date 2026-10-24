import React, { useState } from 'react';
import { PROMPT_INSPIRATIONS, STYLES } from '../constants';
import { PromptInspiration } from '../types';
import { 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Compass, 
  Filter,
  Check,
  Copy
} from 'lucide-react';

interface InspirationGalleryProps {
  onApplyPrompt: (item: PromptInspiration) => void;
}

const CATEGORIES = [
  'Tất cả',
  'Việt Nam Tuyệt Đẹp',
  'Anime & Manga',
  'Tương Lai & Viễn Tưởng',
  'Kỳ Ảo & Phép Thuật',
  'Động Vật & 3D',
  'Tối Giản & Đời Sống',
];

export const InspirationGallery: React.FC<InspirationGalleryProps> = ({ onApplyPrompt }) => {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [prompts, setPrompts] = useState<PromptInspiration[]>(PROMPT_INSPIRATIONS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const filteredPrompts = selectedCategory === 'Tất cả'
    ? prompts
    : prompts.filter((p) => p.category === selectedCategory);

  const handleFetchAiSuggestions = async () => {
    setIsLoadingMore(true);
    try {
      const res = await fetch('/api/suggest-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions)) {
        const formatted: PromptInspiration[] = data.suggestions.map((s: any) => ({
          title: s.title || 'Ý tưởng sáng tạo AI',
          prompt: s.prompt,
          style: s.style || 'photorealistic',
          aspectRatio: s.aspectRatio || '1:1',
          category: selectedCategory === 'Tất cả' ? 'Gợi ý mới' : selectedCategory,
        }));
        setPrompts((prev) => [...formatted, ...prev]);
      }
    } catch (err) {
      console.error('Fetch suggestions error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCopy = (text: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Hero Banner for Inspiration */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/20 overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Thư viện câu lệnh thịnh hành</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Khám phá & Khơi nguồn cảm hứng sáng tạo
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Chọn bất kỳ mẫu câu lệnh chuẩn đẹp nào bên dưới để nạp vào phòng vẽ chỉ với 1 cú nhấp chuột.
            Hoặc nhờ Gemini gợi ý thêm ý tưởng mới theo từng chủ đề.
          </p>

          <button
            type="button"
            onClick={handleFetchAiSuggestions}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingMore ? 'animate-spin' : ''}`} />
            <span>{isLoadingMore ? 'Đang tạo ý tưởng mới...' : 'Nhờ AI gợi ý thêm câu lệnh'}</span>
          </button>
        </div>
      </div>

      {/* Category Pill Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-500 ml-1 shrink-0" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Inspiration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrompts.map((item, idx) => {
          const styleObj = STYLES.find((s) => s.id === item.style);
          return (
            <div
              key={idx}
              className="group relative rounded-2xl p-5 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/60 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-950/30"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {styleObj?.name || item.style}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {item.aspectRatio}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  "{item.prompt}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={(e) => handleCopy(item.prompt, idx, e)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 py-1"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onApplyPrompt(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold shadow transition-all group-hover:translate-x-0.5"
                >
                  <span>Dùng mẫu này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
