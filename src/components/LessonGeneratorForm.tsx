import React, { useState } from 'react';
import { 
  Sparkles, 
  BookMarked, 
  Layers, 
  Compass, 
  Lightbulb, 
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  School,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { GenerationParams } from '../types/lesson';
import { 
  SUBJECTS_LIST, 
  GRADE_OPTIONS, 
  CURRICULUM_OPTIONS, 
  DURATION_OPTIONS, 
  TEACHING_METHOD_OPTIONS, 
  TEACHING_TOOL_OPTIONS 
} from '../data/subjects';

interface LessonGeneratorFormProps {
  onGenerate: (params: GenerationParams) => Promise<void>;
  isLoading: boolean;
  loadingStage: string;
}

export const LessonGeneratorForm: React.FC<LessonGeneratorFormProps> = ({
  onGenerate,
  isLoading,
  loadingStage,
}) => {
  const [standardFormat, setStandardFormat] = useState<'CV5512' | 'CV2345' | 'STEM' | 'COMPACT'>('CV5512');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('toan');
  const [grade, setGrade] = useState<string>('Lớp 8');
  const [curriculum, setCurriculum] = useState<string>(CURRICULUM_OPTIONS[0]);
  const [lessonTitle, setLessonTitle] = useState<string>('Định lí Pythagore và ứng dụng thực tiễn');
  const [duration, setDuration] = useState<string>('2 tiết (90 phút)');
  const [teachingMethod, setTeachingMethod] = useState<string>(TEACHING_METHOD_OPTIONS[0]);
  const [teachingTools, setTeachingTools] = useState<string>(TEACHING_TOOL_OPTIONS[0]);
  const [targetAudienceProfile, setTargetAudienceProfile] = useState<string>('Lớp học tiêu chuẩn, học sinh tích cực tương tác, phân hóa vừa phải');
  const [additionalNotes, setAdditionalNotes] = useState<string>('Thiết kế hoạt động Khởi động sinh động bằng trò chơi; Phiếu học tập có phân hóa từ nhận biết đến vận dụng cao.');
  const [teacherName, setTeacherName] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Find currently selected subject details
  const currentSubjectObj = SUBJECTS_LIST.find(s => s.id === selectedSubjectId) || SUBJECTS_LIST[0];

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const sub = SUBJECTS_LIST.find(s => s.id === subjectId);
    if (sub && sub.popularTopics.length > 0) {
      setLessonTitle(sub.popularTopics[0]);
    }
  };

  const handleQuickTopic = (topic: string) => {
    setLessonTitle(topic);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim()) {
      alert('Vui lòng nhập tên bài dạy.');
      return;
    }

    onGenerate({
      subject: currentSubjectObj.name,
      grade,
      curriculum,
      lessonTitle: lessonTitle.trim(),
      duration,
      teachingMethod,
      teachingTools,
      targetAudienceProfile,
      additionalNotes,
      standardFormat,
      teacherName: teacherName.trim(),
      schoolName: schoolName.trim(),
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Banner / Format Selector */}
      <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white relative">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Trợ lý Soạn Giáo Án Thông Minh GDPT 2018</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Soạn Kế Hoạch Bài Dạy Chuẩn Hóa Tự Động
          </h2>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Hệ thống tự động biên soạn toàn diện mục tiêu (Kiến thức - Năng lực - Phẩm chất), thiết bị dạy học, 
            tiến trình 4 hoạt động chuẩn 5512/2345 và phiếu học tập phân hóa chỉ trong vài giây.
          </p>

          {/* Quy chuẩn Công văn Selector */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setStandardFormat('CV5512')}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left flex items-center space-x-2 border ${
                standardFormat === 'CV5512'
                  ? 'bg-white text-indigo-950 border-white shadow-md'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${standardFormat === 'CV5512' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
              <div>
                <div className="font-bold">Công văn 5512</div>
                <div className="text-[10px] opacity-75">THCS & THPT</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setStandardFormat('CV2345');
                setGrade('Lớp 4');
              }}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left flex items-center space-x-2 border ${
                standardFormat === 'CV2345'
                  ? 'bg-white text-indigo-950 border-white shadow-md'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${standardFormat === 'CV2345' ? 'bg-emerald-600' : 'bg-slate-300'}`} />
              <div>
                <div className="font-bold">Công văn 2345</div>
                <div className="text-[10px] opacity-75">Cấp Tiểu học</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStandardFormat('STEM')}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left flex items-center space-x-2 border ${
                standardFormat === 'STEM'
                  ? 'bg-white text-indigo-950 border-white shadow-md'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${standardFormat === 'STEM' ? 'bg-amber-600' : 'bg-slate-300'}`} />
              <div>
                <div className="font-bold">Dự án STEM</div>
                <div className="text-[10px] opacity-75">Tích hợp liên môn</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStandardFormat('COMPACT')}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left flex items-center space-x-2 border ${
                standardFormat === 'COMPACT'
                  ? 'bg-white text-indigo-950 border-white shadow-md'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${standardFormat === 'COMPACT' ? 'bg-blue-600' : 'bg-slate-300'}`} />
              <div>
                <div className="font-bold">Bản tóm tắt</div>
                <div className="text-[10px] opacity-75">Lên lớp nhanh</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Fields */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* Row 1: Subject, Grade & Curriculum */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Môn học */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <BookMarked className="w-4 h-4 text-indigo-600" />
              <span>Môn học *</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all"
            >
              {SUBJECTS_LIST.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.category})
                </option>
              ))}
            </select>
          </div>

          {/* Khối lớp */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Khối lớp *</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Bộ sách giáo khoa */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Bộ sách giáo khoa *</span>
            </label>
            <select
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all"
            >
              {CURRICULUM_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Lesson Title + Quick Topic Suggestion Pills */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-700 flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Tên bài dạy / Chủ đề bài học *</span>
            </label>
            <span className="text-xs text-slate-500">Ví dụ: Bài 9: Định lí Pythagore</span>
          </div>
          <input
            type="text"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            placeholder="Nhập tên bài dạy, bài học hoặc chủ đề liên môn..."
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 font-semibold text-base placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all"
          />

          {/* Popular Topics Suggestions */}
          {currentSubjectObj.popularTopics.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 mr-1 flex items-center">
                <Sparkles className="w-3 h-3 text-indigo-500 mr-1" /> Gợi ý chủ đề hay:
              </span>
              {currentSubjectObj.popularTopics.map((topic, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickTopic(topic)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    lessonTitle === topic
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-medium'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 3: Duration & Teaching Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Thời lượng */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Thời lượng thực hiện</span>
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Phương pháp dạy học */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Phương pháp / Kỹ thuật dạy học chủ đạo</span>
            </label>
            <select
              value={teachingMethod}
              onChange={(e) => setTeachingMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all"
            >
              {TEACHING_METHOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Teaching Tools */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Thiết bị dạy học và học liệu dự kiến</span>
          </label>
          <select
            value={teachingTools}
            onChange={(e) => setTeachingTools(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all"
          >
            {TEACHING_TOOL_OPTIONS.map((tool) => (
              <option key={tool} value={tool}>
                {tool}
              </option>
            ))}
          </select>
        </div>

        {/* Collapsible Advanced Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-all text-xs sm:text-sm font-semibold text-slate-700"
          >
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Tùy chọn mở rộng: Giáo viên, Trường học & Yêu cầu sư phạm cá nhân hóa</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="p-4 sm:p-5 bg-white space-y-4 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center space-x-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Họ và tên Giáo viên soạn bài:</span>
                  </label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Ví dụ: Thầy Nguyễn Văn An"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center space-x-1">
                    <School className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tên Trường / Tổ chuyên môn:</span>
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Ví dụ: Trường THCS & THPT Lê Quý Đôn"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Đặc điểm đối tượng học sinh:
                </label>
                <input
                  type="text"
                  value={targetAudienceProfile}
                  onChange={(e) => setTargetAudienceProfile(e.target.value)}
                  placeholder="Ví dụ: Học sinh sôi nổi, yêu thích công nghệ; hoặc Lớp có nhiều em tiếp thu chậm cần giàn giáo hỗ trợ..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Yêu cầu chuyên môn bổ sung của giáo viên:
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú thêm về hoạt động mong muốn (ví dụ: Muốn có trò chơi Kahoot ở Luyện tập, dự án mini ở Vận dụng...)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button & Live Loading Stages */}
        <div className="pt-2">
          {isLoading ? (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center space-y-4 animate-pulse">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white shadow-md">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-indigo-900">
                  Hệ thống đang tự động hóa soạn Kế hoạch bài dạy...
                </h3>
                <p className="mt-1 text-sm text-indigo-700 font-medium">
                  {loadingStage || 'Đang chuẩn hóa mục tiêu YCCĐ và 4 hoạt động theo chuẩn CV 5512...'}
                </p>
              </div>
              <div className="w-full max-w-md mx-auto bg-indigo-200 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '70%' }} />
              </div>
              <div className="text-xs text-indigo-600/80">
                ⚡ Tự động tính toán mục tiêu kiến thức, năng lực đặc thù, kịch bản sư phạm 4 bước, phiếu học tập và bảng kiểm Rubric.
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-xl font-bold text-base sm:text-lg text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:via-blue-700 hover:to-indigo-800 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Tạo Kế Hoạch Bài Dạy Chuẩn Hóa Ngay</span>
            </button>
          )}
        </div>

        {/* Feature summary highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Chuẩn 4 bước 5512</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Đầy đủ Phiếu học tập</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Ma trận & Rubric</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Xuất Word (.doc) 1 click</span>
          </div>
        </div>
      </form>
    </div>
  );
};
