import React, { useState } from 'react';
import { 
  Wand2, 
  Dices, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  SlidersHorizontal,
  Loader2,
  Check
} from 'lucide-react';
import { PROMPT_INSPIRATIONS } from '../constants';

interface PromptBoxProps {
  prompt: string;
  setPrompt: (value: string) => void;
  negativePrompt: string;
  setNegativePrompt: (value: string) => void;
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
  onSelectRatio: (ratio: string) => void;
}

export const PromptBox: React.FC<PromptBoxProps> = ({
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  selectedStyle,
  onSelectStyle,
  onSelectRatio,
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enhancedTags, setEnhancedTags] = useState<string[]>([]);
  const [enhancedNotice, setEnhancedNotice] = useState<string | null>(null);

  // Magic prompt enhancement with Gemini
  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setEnhancedNotice(null);

    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style: selectedStyle }),
      });

      const data = await res.json();
      if (data.success && data.enhanced_vi) {
        setPrompt(data.enhanced_vi);
        if (Array.isArray(data.style_tags)) {
          setEnhancedTags(data.style_tags);
        }
        setEnhancedNotice('Prompt đã được tối ưu chi tiết với Gemini AI!');
        setTimeout(() => setEnhancedNotice(null), 4000);
      }
    } catch (err) {
      console.error('Enhance failed:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Random prompt generator
  const handleRandomPrompt = () => {
    const randomItem = PROMPT_INSPIRATIONS[Math.floor(Math.random() * PROMPT_INSPIRATIONS.length)];
    setPrompt(randomItem.prompt);
    onSelectStyle(randomItem.style);
    onSelectRatio(randomItem.aspectRatio);
  };

  const quickPicks = [
    { label: '🏮 Hội An đèn lồng', prompt: 'Phố cổ Hội An rực rỡ hàng ngàn đèn lồng phản chiếu trên sông Hoài tĩnh lặng, sắc vàng ấm áp 8K' },
    { label: '🚀 Mèo phi hành gia', prompt: 'Chú mèo lông vàng đeo mũ bảo hiểm phi hành gia NASA lơ lửng giữa dải ngân hà rực rỡ, 3D cute' },
    { label: '⚡ Cyberpunk Sài Gòn', prompt: 'Sài Gòn tương lai rực rỡ biển hiệu hologram neon xanh tím dưới mưa đêm, xe bay lướt qua các tòa tháp' },
    { label: '🌸 Thiếu nữ hoa anh đào', prompt: 'Thiếu nữ ngắm cánh hoa anh đào bay nhẹ nhàng bên khung cửa sổ quán cafe gỗ, phong cách anime Ghibli' },
    { label: '🌾 Ruộng bậc thang lúa chín', prompt: 'Ruộng bậc thang Mù Cang Chải mùa lúa chín vàng óng ả uốn lượn theo sườn núi, biển mây bình minh kỳ vĩ' },
  ];

  return (
    <div className="space-y-3">
      {/* Label and Actions */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Mô tả hình ảnh bạn muốn tạo (Prompt)</span>
        </label>

        <div className="flex items-center gap-2">
          {/* Surprise Me Button */}
          <button
            type="button"
            onClick={handleRandomPrompt}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Gợi ý ngẫu nhiên một ý tưởng độc đáo"
          >
            <Dices className="w-3.5 h-3.5 text-amber-400" />
            <span>Ý tưởng ngẫu nhiên</span>
          </button>

          {/* Magic AI Prompt Enhancer */}
          <button
            type="button"
            onClick={handleEnhancePrompt}
            disabled={!prompt.trim() || isEnhancing}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              prompt.trim() && !isEnhancing
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/20 hover:brightness-110 active:scale-95'
                : 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
            title="Dùng Gemini mở rộng mô tả với chi tiết ánh sáng, bố cục và kết cấu"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tối ưu...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 text-pink-300" />
                <span>Đũa phép AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Textarea container */}
      <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-slate-700/60 to-slate-800/40 focus-within:from-indigo-500 focus-within:to-purple-500 transition-all">
        <div className="relative bg-slate-950/90 rounded-[15px] p-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Ví dụ: Chú rồng phương Đông dát vàng uốn lượn trên đỉnh núi Phan Xi Păng mù sương, ánh nắng ban mai rực rỡ, độ nét cực cao..."
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm sm:text-base focus:outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>{prompt.length} ký tự</span>
              {prompt.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors py-0.5 px-2 rounded hover:bg-slate-800/60"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tùy chọn nâng cao</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Notice / Tags Toast */}
      {enhancedNotice && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs animate-fade-in">
          <Check className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{enhancedNotice}</span>
        </div>
      )}

      {/* Enhanced visual tags */}
      {enhancedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400">Thẻ chi tiết:</span>
          {enhancedTags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-300 border border-purple-700/40"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 whitespace-nowrap text-[11px]">Gợi ý nhanh:</span>
        {quickPicks.map((pick, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPrompt(pick.prompt)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors shrink-0"
          >
            {pick.label}
          </button>
        ))}
      </div>

      {/* Advanced Drawer: Negative Prompt */}
      {showAdvanced && (
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              Negative Prompt (Những chi tiết muốn loại trừ khỏi ảnh)
            </label>
            <span className="text-[11px] text-slate-500">Tùy chọn</span>
          </div>
          <input
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="Ví dụ: mờ, nhòe, biến dạng, nhiều ngón tay thừa, mắt lệch, chất lượng thấp, watermark..."
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            {['mờ nhòe', 'thừa chi tiết', 'chất lượng thấp', 'vỡ hình'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const current = negativePrompt.trim();
                  if (!current.includes(tag)) {
                    setNegativePrompt(current ? `${current}, ${tag}` : tag);
                  }
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
