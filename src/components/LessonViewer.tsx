import React, { useState } from 'react';
import { 
  FileDown, 
  Printer, 
  Copy, 
  Bookmark, 
  BookmarkCheck, 
  Edit3, 
  Eye, 
  Clock, 
  Wand2, 
  Share2, 
  Check, 
  FileText,
  Layers,
  Sparkles,
  BookOpen,
  School,
  Maximize2,
  TableProperties
} from 'lucide-react';
import { LessonPlan } from '../types/lesson';
import { exportToWordDoc, exportToMarkdown } from '../utils/docxExport';
import confetti from 'canvas-confetti';

interface LessonViewerProps {
  plan: LessonPlan;
  onUpdatePlan: (updatedPlan: LessonPlan) => void;
  onSaveToLibrary: (plan: LessonPlan) => void;
  isSaved: boolean;
  onOpenCopilotWithPlan: (plan: LessonPlan, toolType?: string) => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  plan,
  onUpdatePlan,
  onSaveToLibrary,
  isSaved,
  onOpenCopilotWithPlan,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'editor' | 'timeline' | 'worksheets'>('preview');
  const [editedContent, setEditedContent] = useState<string>(plan.content);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [quickAIInput, setQuickAIInput] = useState<string>('');
  const [isAiRefining, setIsAiRefining] = useState<boolean>(false);

  // Sync editedContent if plan changes
  React.useEffect(() => {
    setEditedContent(plan.content);
  }, [plan.id, plan.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(plan.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWord = () => {
    setIsExporting(true);
    try {
      exportToWordDoc(plan);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error(err);
      alert('Không thể xuất file Word. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveContent = () => {
    onUpdatePlan({
      ...plan,
      content: editedContent,
      updatedAt: new Date().toISOString(),
    });
    alert('Đã cập nhật nội dung giáo án thành công!');
  };

  const handleQuickAiRefine = async (instruction: string) => {
    if (!instruction.trim()) return;
    setIsAiRefining(true);
    try {
      const response = await fetch('/api/ai-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType: 'improve-section',
          lessonInfo: {
            subject: plan.subject,
            grade: plan.grade,
            lessonTitle: plan.title,
          },
          customPrompt: `Yêu cầu tinh chỉnh: "${instruction}".\nNội dung kế hoạch bài dạy hiện tại:\n${plan.content}`,
        }),
      });

      const data = await response.json();
      if (data.success && data.result) {
        const refinedContent = data.result;
        setEditedContent(refinedContent);
        onUpdatePlan({
          ...plan,
          content: refinedContent,
          updatedAt: new Date().toISOString(),
        });
        alert('Đã áp dụng tinh chỉnh của AI thành công!');
      } else {
        alert(data.error || 'Không thể tinh chỉnh kế hoạch bài dạy.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi gửi yêu cầu AI: ' + err.message);
    } finally {
      setIsAiRefining(false);
      setQuickAIInput('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Action Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              {plan.subject}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
              {plan.grade}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 hidden sm:inline-block">
              {plan.standardFormat || 'CV 5512'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hidden md:inline-block">
              {plan.duration}
            </span>
          </div>
          <h1 className="mt-1.5 text-lg sm:text-xl font-bold text-slate-900 line-clamp-1">
            {plan.title}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Save to library */}
          <button
            onClick={() => onSaveToLibrary(plan)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
              isSaved
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4 text-rose-600" /> : <Bookmark className="w-4 h-4 text-slate-500" />}
            <span>{isSaved ? 'Đã lưu' : 'Lưu thư viện'}</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all"
            title="Sao chép toàn bộ nội dung"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all hidden sm:flex"
            title="In ấn hoặc Lưu PDF chuẩn trang A4"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>In / PDF</span>
          </button>

          {/* Word Download */}
          <button
            onClick={handleDownloadWord}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-xs shadow-blue-200 transition-all"
            title="Tải file Word (.doc) chuẩn mẫu Bộ GD&ĐT"
          >
            <FileDown className="w-4 h-4" />
            <span>Tải file Word (.doc)</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4">
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center space-x-2 py-3 px-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'preview'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Văn bản Sư phạm</span>
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center space-x-2 py-3 px-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'editor'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Chỉnh sửa giáo án</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center space-x-2 py-3 px-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'timeline'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Kịch bản lên lớp (Timeline)</span>
        </button>

        <button
          onClick={() => setActiveTab('worksheets')}
          className={`flex items-center space-x-2 py-3 px-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'worksheets'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <TableProperties className="w-4 h-4 text-emerald-600" />
          <span>Phiếu học tập & Rubric</span>
        </button>
      </div>

      {/* Quick AI Refine Bar */}
      <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-900">
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span>Trợ lý AI Tinh chỉnh nhanh:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 flex-1 max-w-xl">
          <button
            onClick={() => handleQuickAiRefine('Bổ sung thêm trò chơi học tập khởi động gay cấn và hấp dẫn hơn')}
            disabled={isAiRefining}
            className="text-xs px-2.5 py-1 rounded-full bg-white text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-all font-medium disabled:opacity-50"
          >
            + Trò chơi khởi động
          </button>
          <button
            onClick={() => handleQuickAiRefine('Chi tiết hóa hơn nữa lời thoại và bước chuyển giao nhiệm vụ của giáo viên')}
            disabled={isAiRefining}
            className="text-xs px-2.5 py-1 rounded-full bg-white text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-all font-medium disabled:opacity-50"
          >
            + Chi tiết hóa lời thoại GV
          </button>
          <button
            onClick={() => handleQuickAiRefine('Bổ sung thêm 5 câu hỏi trắc nghiệm kiểm tra nhanh kèm ma trận')}
            disabled={isAiRefining}
            className="text-xs px-2.5 py-1 rounded-full bg-white text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-all font-medium disabled:opacity-50"
          >
            + Câu hỏi trắc nghiệm
          </button>
          <button
            onClick={() => onOpenCopilotWithPlan(plan)}
            className="text-xs px-2.5 py-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-medium"
          >
            Mở bộ công cụ chuyên biệt →
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-6 sm:p-8 flex-1 overflow-auto bg-slate-50/40">
        {activeTab === 'preview' && (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xs border border-slate-200 p-8 sm:p-12 print:border-none print:shadow-none print:p-0">
            {/* Vietnamese Educational Standard Header */}
            <div className="border-b-2 border-slate-900/10 pb-6 mb-8 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm font-semibold text-slate-800 mb-6">
                <div className="text-center sm:text-left mb-3 sm:mb-0">
                  <div className="uppercase tracking-wide font-bold">
                    {plan.schoolName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}
                  </div>
                  <div className="text-slate-600">TỔ CHUYÊN MÔN: {plan.subject.toUpperCase()}</div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="uppercase font-bold tracking-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="italic font-medium text-slate-700">Độc lập - Tự do - Hạnh phúc</div>
                </div>
              </div>

              <div className="text-center my-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 uppercase tracking-tight">
                  KẾ HOẠCH BÀI DẠY
                </h1>
                <h2 className="text-lg sm:text-xl font-bold text-indigo-900 mt-1 uppercase">
                  MÔN: {plan.subject} - {plan.grade}
                </h2>
                <div className="text-xs text-slate-500 italic mt-1">
                  (Theo chuẩn Công văn số 5512/BGDĐT-GDTrH của Bộ Giáo dục và Đào tạo)
                </div>
              </div>

              {/* Lesson Metadata Table */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span className="font-semibold text-slate-700">• Tên bài dạy: </span>
                  <span className="font-bold text-slate-900">{plan.title}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">• Thời lượng: </span>
                  <span className="text-slate-800">{plan.duration}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">• Bộ sách: </span>
                  <span className="text-slate-800">{plan.curriculum}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">• Giáo viên: </span>
                  <span className="text-slate-800 font-medium">{plan.teacherName || 'Chưa cập nhật'}</span>
                </div>
              </div>
            </div>

            {/* Formatted Markdown Content */}
            <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-indigo-950 prose-h2:border-b prose-h2:border-indigo-100 prose-h2:pb-2 prose-h3:text-indigo-900 prose-h4:text-slate-800 leading-relaxed font-serif text-[15px] sm:text-[16px]">
              <RenderMarkdownContent content={plan.content} />
            </div>

            {/* Approval Footer */}
            <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 gap-4 text-center text-sm text-slate-800">
              <div>
                <div className="font-bold uppercase">DUYỆT CỦA TỔ TRƯỞNG CHUYÊN MÔN</div>
                <div className="italic text-xs text-slate-500 mt-0.5">(Ký và ghi rõ họ tên)</div>
                <div className="h-20" />
              </div>
              <div>
                <div className="italic text-xs text-slate-600 mb-1">
                  Ngày ..... tháng ..... năm 202...
                </div>
                <div className="font-bold uppercase">GIÁO VIÊN SOẠN BÀI</div>
                <div className="italic text-xs text-slate-500 mt-0.5">(Ký và ghi rõ họ tên)</div>
                <div className="h-16" />
                <div className="font-bold text-slate-900">{plan.teacherName}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Editor */}
        {activeTab === 'editor' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-xs sm:text-sm text-slate-600 font-medium">
                Bạn có thể sửa đổi, thêm bớt hoạt động và lưu lại trực tiếp vào giáo án.
              </span>
              <button
                onClick={handleSaveContent}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all"
              >
                Lưu thay đổi
              </button>
            </div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={28}
              className="w-full p-5 rounded-xl border border-slate-300 font-mono text-sm leading-relaxed text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
          </div>
        )}

        {/* Tab 3: Timeline / Presenter Mode */}
        {activeTab === 'timeline' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex items-center space-x-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Chế độ Kịch bản Lên lớp: </span>
                Tóm tắt trực quan 4 hoạt động giúp thầy cô kiểm soát thời lượng tiết dạy và các bước chuyển giao khi đứng trên bục giảng.
              </div>
            </div>

            <div className="space-y-4">
              {/* Activity 1 */}
              <div className="bg-white rounded-xl p-5 border-l-4 border-l-amber-500 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      HOẠT ĐỘNG 1
                    </span>
                    <h3 className="font-bold text-slate-900">Mở đầu / Khởi động</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    5 - 7 phút
                  </span>
                </div>
                <div className="mt-3 text-sm text-slate-700 space-y-2">
                  <p><strong>• Mục tiêu cốt lõi:</strong> Tạo hứng thú, kích hoạt kiến thức nền, tạo mâu thuẫn nhận thức để dẫn vào bài mới.</p>
                  <p><strong>• Thao tác GV:</strong> Chiếu hình ảnh / video / bài toán thực tế, giao lệnh trò chơi, quản trò.</p>
                  <p><strong>• Thao tác HS:</strong> Quan sát, thảo luận cặp đôi nhanh, phát biểu ý kiến ban đầu.</p>
                </div>
              </div>

              {/* Activity 2 */}
              <div className="bg-white rounded-xl p-5 border-l-4 border-l-blue-600 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      HOẠT ĐỘNG 2
                    </span>
                    <h3 className="font-bold text-slate-900">Hình thành kiến thức mới</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    20 - 25 phút
                  </span>
                </div>
                <div className="mt-3 text-sm text-slate-700 space-y-2">
                  <p><strong>• Mục tiêu cốt lõi:</strong> Học sinh tự lực hoặc hợp tác phát hiện và làm chủ kiến thức trọng tâm.</p>
                  <p><strong>• Thao tác 4 bước 5512:</strong></p>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600">
                    <li><em>Bước 1 (Chuyển giao):</em> GV chia nhóm, phát Phiếu học tập số 1, giải thích rõ quy tắc.</li>
                    <li><em>Bước 2 (Thực hiện):</em> HS làm việc cá nhân rồi thảo luận nhóm; GV đi quanh hỗ trợ nhóm khó khăn.</li>
                    <li><em>Bước 3 (Báo cáo):</em> Đại diện 1-2 nhóm trình bày; các nhóm khác nhận xét, phản biện.</li>
                    <li><em>Bước 4 (Kết luận):</em> GV chốt kiến thức chuẩn hóa, ghi bảng nội dung cốt lõi.</li>
                  </ul>
                </div>
              </div>

              {/* Activity 3 */}
              <div className="bg-white rounded-xl p-5 border-l-4 border-l-emerald-600 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      HOẠT ĐỘNG 3
                    </span>
                    <h3 className="font-bold text-slate-900">Luyện tập</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    10 - 12 phút
                  </span>
                </div>
                <div className="mt-3 text-sm text-slate-700 space-y-2">
                  <p><strong>• Mục tiêu cốt lõi:</strong> Khắc sâu kiến thức, rèn kĩ năng giải bài tập cơ bản và thông hiểu.</p>
                  <p><strong>• Thao tác GV:</strong> Giao bài tập trên Phiếu học tập số 2 hoặc trò chơi trắc nghiệm tương tác.</p>
                  <p><strong>• Thao tác HS:</strong> Làm bài độc lập, chấm chéo cặp bàn, đối chiếu lời giải chuẩn.</p>
                </div>
              </div>

              {/* Activity 4 */}
              <div className="bg-white rounded-xl p-5 border-l-4 border-l-purple-600 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                      HOẠT ĐỘNG 4
                    </span>
                    <h3 className="font-bold text-slate-900">Vận dụng & Mở rộng</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    3 - 5 phút
                  </span>
                </div>
                <div className="mt-3 text-sm text-slate-700 space-y-2">
                  <p><strong>• Mục tiêu cốt lõi:</strong> Kết nối tri thức vào đời sống thực tiễn, định hướng phát triển năng lực tự học.</p>
                  <p><strong>• Nhiệm vụ về nhà:</strong> Dự án mini thực tế, bài tập sáng tạo, chuẩn bị trước bài tiếp theo.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Worksheets & Rubrics */}
        {activeTab === 'worksheets' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Phụ lục Hồ sơ Dạy học & Đánh giá</h3>
                <p className="text-xs text-slate-500">Trích xuất nhanh phiếu học tập và tiêu chí chấm điểm để in ấn cho học sinh.</p>
              </div>
              <button
                onClick={() => onOpenCopilotWithPlan(plan, 'generate-worksheet')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Tạo thêm Phiếu học tập phân hóa</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <div className="border-2 border-dashed border-indigo-200 rounded-xl p-5 bg-indigo-50/30">
                <div className="flex justify-between items-center mb-4 border-b border-indigo-100 pb-2">
                  <span className="text-xs font-bold text-indigo-900 uppercase">PHIẾU HỌC TẬP - HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC</span>
                  <span className="text-xs text-slate-500">Môn {plan.subject} - {plan.grade}</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1 mb-4">
                  <p>Họ và tên học sinh: .................................................... Lớp: .......... Nhóm: ..........</p>
                  <p>Nhiệm vụ: Đọc SGK, thảo luận nhóm và hoàn thành các câu hỏi trong phiếu.</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-sm font-mono whitespace-pre-wrap text-slate-800">
                  {extractWorksheetSection(plan.content)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper: Simple Markdown Renderer
function RenderMarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[] = [];
  let codeBlock = false;
  let codeContent: string[] = [];

  const flushTable = (key: number) => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${key}`} className="overflow-x-auto my-4 not-prose">
          <table className="min-w-full divide-y divide-slate-200 border border-slate-300 rounded-lg text-sm">
            <thead className="bg-slate-100">
              <tr>
                {tableRows[0]
                  .split('|')
                  .slice(1, -1)
                  .map((cell, idx) => (
                    <th key={idx} className="px-3 py-2 text-left font-bold text-slate-800 border-r border-slate-300 last:border-r-0">
                      {cell.trim()}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {tableRows.slice(2).map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  {row
                    .split('|')
                    .slice(1, -1)
                    .map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-slate-700 border-r border-slate-200 last:border-r-0">
                        {cell.trim()}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  lines.forEach((line, index) => {
    // Check Code blocks
    if (line.trim().startsWith('```')) {
      if (codeBlock) {
        elements.push(
          <pre key={`code-${index}`} className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs sm:text-sm font-mono overflow-x-auto my-4">
            <code>{codeContent.join('\n')}</code>
          </pre>
        );
        codeContent = [];
        codeBlock = false;
      } else {
        codeBlock = true;
      }
      return;
    }

    if (codeBlock) {
      codeContent.push(line);
      return;
    }

    // Check Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      tableRows.push(line.trim());
      return;
    } else if (inTable) {
      flushTable(index);
      inTable = false;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={index} className="text-xl sm:text-2xl font-black text-slate-900 mt-6 mb-3 uppercase tracking-tight">
          {line.replace('# ', '')}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-lg sm:text-xl font-bold text-indigo-950 mt-6 mb-2.5 pb-1 border-b border-indigo-100">
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-base sm:text-lg font-bold text-indigo-900 mt-4 mb-2">
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={index} className="text-sm sm:text-base font-bold text-slate-800 mt-3 mb-1">
          {line.replace('#### ', '')}
        </h4>
      );
    } else if (line.startsWith('##### ')) {
      elements.push(
        <h5 key={index} className="text-xs sm:text-sm font-bold text-slate-700 mt-2 mb-1">
          {line.replace('##### ', '')}
        </h5>
      );
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <li key={index} className="text-slate-800 ml-4 list-disc my-1">
          {formatInlineStyles(line.trim().substring(2))}
        </li>
      );
    } else if (line.trim().length === 0) {
      elements.push(<div key={index} className="h-2" />);
    } else {
      elements.push(
        <p key={index} className="text-slate-800 leading-relaxed my-1.5 text-justify">
          {formatInlineStyles(line)}
        </p>
      );
    }
  });

  if (inTable) {
    flushTable(lines.length);
  }

  return <>{elements}</>;
}

function formatInlineStyles(text: string): React.ReactNode {
  // Bold formatting
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function extractWorksheetSection(content: string): string {
  const parts = content.split(/IV\.\s*HỒ SƠ DẠY HỌC|PHỤ LỤC/i);
  if (parts.length > 1) {
    return parts[1].trim();
  }
  return content.slice(-1200);
}
