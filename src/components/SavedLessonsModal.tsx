import React, { useState } from 'react';
import { 
  FolderHeart, 
  Search, 
  Trash2, 
  FileDown, 
  Copy, 
  Clock, 
  BookOpen, 
  PlusCircle, 
  Upload, 
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { LessonPlan } from '../types/lesson';
import { exportToWordDoc } from '../utils/docxExport';

interface SavedLessonsModalProps {
  savedPlans: LessonPlan[];
  onSelectPlan: (plan: LessonPlan) => void;
  onDeletePlan: (id: string) => void;
  onDuplicatePlan: (plan: LessonPlan) => void;
  onImportPlans: (plans: LessonPlan[]) => void;
  onNewPlan: () => void;
}

export const SavedLessonsModal: React.FC<SavedLessonsModalProps> = ({
  savedPlans,
  onSelectPlan,
  onDeletePlan,
  onDuplicatePlan,
  onImportPlans,
  onNewPlan,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  // Filter plans
  const filteredPlans = savedPlans.filter((plan) => {
    const matchesSearch =
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.grade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || plan.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const subjects = Array.from(new Set(savedPlans.map((p) => p.subject)));

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedPlans, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `EduPlan_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportPlans(parsed);
            alert(`Đã nhập thành công ${parsed.length} giáo án vào thư viện!`);
          } else {
            alert('File dữ liệu không đúng định dạng mảng giáo án.');
          }
        } catch (err) {
          alert('Không thể đọc file JSON. Vui lòng kiểm tra lại.');
        }
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
            <FolderHeart className="w-4 h-4 text-rose-500" />
            <span>Thư Viện Giáo Án Cá Nhân</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Quản Lý Kế Hoạch Bài Dạy ({savedPlans.length} bài)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dữ liệu được lưu trữ an toàn trong trình duyệt của bạn, sẵn sàng xem lại, chỉnh sửa hoặc xuất Word bất cứ lúc nào.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onNewPlan}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center space-x-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Soạn bài mới</span>
          </button>

          <button
            onClick={handleExportBackup}
            disabled={savedPlans.length === 0}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5 transition-all disabled:opacity-50"
            title="Sao lưu toàn bộ giáo án về máy tính (JSON)"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Sao lưu</span>
          </button>

          <label className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Nhập file</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên bài dạy, môn học, khối lớp..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {subjects.length > 0 && (
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
          >
            <option value="all">Tất cả môn học ({savedPlans.length})</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Lesson Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-8 h-8 stroke-1" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Chưa có kế hoạch bài dạy nào</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Khi bạn tạo giáo án mới hoặc chọn từ kho mẫu và nhấn "Lưu thư viện", các bài dạy sẽ xuất hiện tại đây.
            </p>
          </div>
          <button
            onClick={onNewPlan}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all inline-flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Soạn bài dạy đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col overflow-hidden group"
            >
              <div className="p-5 flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                      {plan.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {plan.grade}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 mr-0.5" />
                    {new Date(plan.updatedAt || plan.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <h3
                  onClick={() => onSelectPlan(plan)}
                  className="font-bold text-base text-slate-900 group-hover:text-indigo-600 cursor-pointer line-clamp-2 transition-colors"
                >
                  {plan.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  Bộ sách: {plan.curriculum} • Thời lượng: {plan.duration}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectPlan(plan)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Mở xem & Chỉnh sửa →
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => exportToWordDoc(plan)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-all"
                    title="Xuất file Word (.doc)"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDuplicatePlan(plan)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-all"
                    title="Nhân bản giáo án"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn xóa giáo án "${plan.title}"?`)) {
                        onDeletePlan(plan.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Xóa giáo án"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
