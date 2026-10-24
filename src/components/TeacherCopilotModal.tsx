import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Gamepad2, 
  FileSpreadsheet, 
  TableProperties, 
  HelpCircle, 
  Users, 
  Copy, 
  Check, 
  FileDown, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { LessonPlan, AIToolType } from '../types/lesson';
import { SUBJECTS_LIST, GRADE_OPTIONS } from '../data/subjects';

interface TeacherCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: LessonPlan | null;
  initialToolType?: AIToolType;
  onAppendToPlan?: (textToAppend: string) => void;
}

export const TeacherCopilotModal: React.FC<TeacherCopilotModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  initialToolType = 'generate-warmup',
  onAppendToPlan,
}) => {
  const [selectedTool, setSelectedTool] = useState<AIToolType>(initialToolType);
  const [subject, setSubject] = useState<string>(currentPlan?.subject || 'Toán học');
  const [grade, setGrade] = useState<string>(currentPlan?.grade || 'Lớp 8');
  const [lessonTitle, setLessonTitle] = useState<string>(currentPlan?.title || 'Định lí Pythagore và ứng dụng');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  React.useEffect(() => {
    if (initialToolType) {
      setSelectedTool(initialToolType);
    }
  }, [initialToolType]);

  React.useEffect(() => {
    if (currentPlan) {
      setSubject(currentPlan.subject);
      setGrade(currentPlan.grade);
      setLessonTitle(currentPlan.title);
    }
  }, [currentPlan]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!lessonTitle.trim()) {
      alert('Vui lòng nhập tên bài học.');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/ai-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType: selectedTool,
          lessonInfo: {
            subject,
            grade,
            lessonTitle,
          },
          customPrompt,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.result);
      } else {
        alert(data.error || 'Có lỗi xảy ra khi tạo học liệu.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (onAppendToPlan && result) {
      onAppendToPlan(`\n\n---\n### BỔ SUNG TỪ TRỢ LÝ SƯ PHẠM:\n${result}`);
      alert('Đã bổ sung nội dung vào kế hoạch bài dạy thành công!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Bộ Công Cụ Sư Phạm Bổ Trợ (AI Co-pilot)</h3>
              <p className="text-xs text-indigo-200">Tự động sinh trò chơi, phiếu học tập, ma trận và rubrics theo chuẩn GDPT 2018</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tools Selector Tabs */}
        <div className="bg-slate-50 p-3 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => setSelectedTool('generate-warmup')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center text-center space-y-1 border ${
              selectedTool === 'generate-warmup'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>3 Trò chơi Khởi động</span>
          </button>

          <button
            onClick={() => setSelectedTool('generate-worksheet')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center text-center space-y-1 border ${
              selectedTool === 'generate-worksheet'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Phiếu học tập phân hóa</span>
          </button>

          <button
            onClick={() => setSelectedTool('generate-rubric')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center text-center space-y-1 border ${
              selectedTool === 'generate-rubric'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <TableProperties className="w-4 h-4" />
            <span>Rubric Đánh giá</span>
          </button>

          <button
            onClick={() => setSelectedTool('generate-quiz')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center text-center space-y-1 border ${
              selectedTool === 'generate-quiz'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Đề Trắc nghiệm 10 câu</span>
          </button>

          <button
            onClick={() => setSelectedTool('differentiated-teaching')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center text-center space-y-1 border ${
              selectedTool === 'differentiated-teaching'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Dạy học Phân hóa</span>
          </button>
        </div>

        {/* Input Parameters */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học:</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-medium"
              >
                {SUBJECTS_LIST.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp:</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-medium"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên bài học:</label>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Ví dụ: Định lí Pythagore"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              ⚡ Tạo ngay học liệu chuẩn xác, tiết kiệm từ 1 đến 2 giờ soạn thảo cho giáo viên.
            </span>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Đang tạo nội dung...' : 'Tạo Ngay'}</span>
            </button>
          </div>
        </div>

        {/* Output Result Area */}
        <div className="p-4 sm:p-6 flex-1 overflow-auto bg-slate-50/50">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-500">
              <Sparkles className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-700">AI đang phân tích kiến thức và thiết kế học liệu...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Kết quả tạo học liệu tự động:
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center space-x-1 shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                  {onAppendToPlan && currentPlan && (
                    <button
                      onClick={handleInsert}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center space-x-1 shadow-2xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Chèn vào Giáo án hiện tại</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-800 font-mono whitespace-pre-wrap max-h-[45vh] overflow-y-auto">
                {result}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
              <BookOpen className="w-10 h-10 stroke-1" />
              <p className="text-sm font-medium text-slate-600">Chọn công cụ và nhấn "Tạo Ngay" để sinh học liệu thông minh.</p>
              <p className="text-xs text-slate-400 max-w-md">
                Bộ công cụ giúp quý thầy cô đa dạng hóa phương pháp, tăng tính tương tác và tổ chức đánh giá học sinh hiệu quả.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
