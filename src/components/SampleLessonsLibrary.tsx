import React from 'react';
import { BookOpen, Sparkles, FileDown, Eye, CheckCircle2, Award } from 'lucide-react';
import { LessonPlan } from '../types/lesson';
import { SAMPLE_LESSONS } from '../data/sampleLessons';
import { exportToWordDoc } from '../utils/docxExport';

interface SampleLessonsLibraryProps {
  onSelectPlan: (plan: LessonPlan) => void;
}

export const SampleLessonsLibrary: React.FC<SampleLessonsLibraryProps> = ({ onSelectPlan }) => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold mb-3">
          <Award className="w-3.5 h-3.5" />
          <span>Kho Kế Hoạch Bài Dạy Mẫu Tiêu Biểu</span>
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
          Giáo Án Mẫu Đạt Chuẩn Sư Phạm Xuất Sắc
        </h2>
        <p className="mt-2 text-indigo-100 text-xs sm:text-sm max-w-2xl">
          Các kế hoạch bài dạy mẫu được biên soạn kỹ lưỡng theo đúng cấu trúc Công văn 5512/BGDĐT-GDTrH, 
          tích hợp đầy đủ kịch bản 4 hoạt động, câu hỏi gợi mở, hoạt động trải nghiệm, phiếu học tập và bảng kiểm Rubric.
        </p>
      </div>

      {/* Grid of sample lessons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAMPLE_LESSONS.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all flex flex-col overflow-hidden group"
          >
            <div className="p-6 flex-1 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {plan.subject}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {plan.grade}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Chuẩn 5512
                </span>
              </div>

              <h3
                onClick={() => onSelectPlan(plan)}
                className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 cursor-pointer line-clamp-2 transition-colors"
              >
                {plan.title}
              </h3>

              <p className="text-xs text-slate-500">
                <strong>Bộ sách:</strong> {plan.curriculum}
              </p>

              <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <strong>Phương pháp:</strong> {plan.teachingMethod}
              </p>

              <div className="pt-2 flex flex-wrap gap-1 text-[11px] text-slate-500">
                {plan.tags?.map((t, idx) => (
                  <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded-md">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => onSelectPlan(plan)}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Xem chi tiết & Dùng mẫu</span>
              </button>

              <button
                onClick={() => exportToWordDoc(plan)}
                className="p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-all flex items-center space-x-1 text-xs font-semibold"
                title="Tải file Word (.doc)"
              >
                <FileDown className="w-4 h-4" />
                <span>Tải Word</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
