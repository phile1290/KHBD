import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ImageUploaderProps {
  imagePreview: string | null;
  onImageSelected: (base64: string | null) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ imagePreview, onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onImageSelected(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      onImageSelected(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Ảnh gốc để biến đổi (Image-to-Image / Remix)</span>
        </div>
        {imagePreview && (
          <button
            type="button"
            onClick={() => onImageSelected(null)}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Gỡ ảnh</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {imagePreview ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center max-h-72">
          <img
            src={imagePreview}
            alt="Source Preview"
            referrerPolicy="no-referrer"
            className="max-h-72 w-auto object-contain rounded-lg"
          />
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 shadow-lg"
            >
              Đổi ảnh khác
            </button>
            <button
              type="button"
              onClick={() => onImageSelected(null)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-500 shadow-lg"
            >
              Xóa
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700/80 hover:border-indigo-500/80 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-900/40"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-center">
            <span className="text-sm font-medium text-slate-200">
              Nhấp để tải ảnh lên hoặc kéo thả vào đây
            </span>
            <p className="text-xs text-slate-500 mt-0.5">Hỗ trợ PNG, JPG, WebP tối đa 15MB</p>
          </div>
        </div>
      )}
    </div>
  );
};
