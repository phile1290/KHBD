import React from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  FolderHeart, 
  Wrench, 
  FileCheck,
  PlusCircle
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'generator' | 'library' | 'samples';
  setActiveTab: (tab: 'generator' | 'library' | 'samples') => void;
  savedCount: number;
  onOpenCopilot: () => void;
  onOpenGuidelines: () => void;
  onNewPlan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  onOpenCopilot,
  onOpenGuidelines,
  onNewPlan,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('generator')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-indigo-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                  EduPlan AI
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Chuẩn CV 5512
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  GDPT 2018
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Hệ thống Tự Động Hóa Soạn Kế Hoạch Bài Dạy cho Giáo Viên
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'generator'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Soạn bài mới</span>
            </button>

            <button
              onClick={() => setActiveTab('samples')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'samples'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">Kho bài mẫu</span>
              <span className="md:hidden">Mẫu</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === 'library'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FolderHeart className="w-4 h-4 text-rose-500" />
              <span className="hidden sm:inline">Thư viện của tôi</span>
              <span className="sm:hidden">Lưu trữ</span>
              {savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                  {savedCount}
                </span>
              )}
            </button>

            {/* AI Copilot modal trigger */}
            <button
              onClick={onOpenCopilot}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-all border border-slate-200/80 hover:border-amber-300"
              title="Công cụ bổ trợ: Khởi động, Phiếu học tập, Rubric, Trắc nghiệm"
            >
              <Wrench className="w-4 h-4 text-amber-600" />
              <span className="hidden lg:inline">Bộ công cụ sư phạm</span>
            </button>

            {/* Standard CV 5512 Guide button */}
            <button
              onClick={onOpenGuidelines}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
              title="Quy chuẩn Công văn 5512 và 2345 của Bộ GD&ĐT"
            >
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Chuẩn CV 5512</span>
            </button>

            {/* Quick Action Button */}
            <button
              onClick={onNewPlan}
              className="ml-1 sm:ml-2 inline-flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Tạo mới</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
