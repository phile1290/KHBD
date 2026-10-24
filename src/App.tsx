import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LessonGeneratorForm } from './components/LessonGeneratorForm';
import { LessonViewer } from './components/LessonViewer';
import { SavedLessonsModal } from './components/SavedLessonsModal';
import { SampleLessonsLibrary } from './components/SampleLessonsLibrary';
import { TeacherCopilotModal } from './components/TeacherCopilotModal';
import { GuidelinesModal } from './components/GuidelinesModal';
import { LessonPlan, GenerationParams, AIToolType } from './types/lesson';
import { SAMPLE_LESSONS } from './data/sampleLessons';
import confetti from 'canvas-confetti';
import { Sparkles, ArrowLeft, BookOpen, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'eduplan_saved_lessons_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'library' | 'samples'>('generator');
  const [currentPlan, setCurrentPlan] = useState<LessonPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<LessonPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  
  // Modals state
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [copilotInitialTool, setCopilotInitialTool] = useState<AIToolType>('generate-warmup');
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState<boolean>(false);

  // Load saved plans from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedPlans(parsed);
          return;
        }
      }
      // If empty, initialize with high-standard sample lessons
      setSavedPlans(SAMPLE_LESSONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_LESSONS));
    } catch (e) {
      console.error('Lỗi tải dữ liệu từ localStorage:', e);
      setSavedPlans(SAMPLE_LESSONS);
    }
  }, []);

  // Sync to localStorage
  const persistPlans = (plans: LessonPlan[]) => {
    setSavedPlans(plans);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch (e) {
      console.error('Lỗi ghi dữ liệu vào localStorage:', e);
    }
  };

  const handleGenerate = async (params: GenerationParams) => {
    setIsLoading(true);
    setLoadingStage('Đang phân tích Mục tiêu & Yêu cầu cần đạt (GDPT 2018)...');

    // Interval to cycle through pedagogical stage descriptions
    const stageTimer1 = setTimeout(() => {
      setLoadingStage('Đang thiết kế 4 Hoạt động theo quy chuẩn CV 5512 (Khởi động -> Khám phá -> Luyện tập -> Vận dụng)...');
    }, 2500);

    const stageTimer2 = setTimeout(() => {
      setLoadingStage('Đang chi tiết hóa 4 bước tương tác (Chuyển giao -> Thực hiện -> Báo cáo -> Kết luận nhận định)...');
    }, 5500);

    const stageTimer3 = setTimeout(() => {
      setLoadingStage('Đang xây dựng Phiếu học tập phân hóa & Bảng tiêu chí đánh giá Rubric...');
    }, 9000);

    try {
      const response = await fetch('/api/generate-lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể tạo kế hoạch bài dạy.');
      }

      const newPlan: LessonPlan = {
        id: 'plan-' + Date.now(),
        title: params.lessonTitle,
        subject: params.subject,
        grade: params.grade,
        curriculum: params.curriculum,
        duration: params.duration,
        standardFormat: params.standardFormat,
        teachingMethod: params.teachingMethod,
        teachingTools: params.teachingTools,
        targetAudienceProfile: params.targetAudienceProfile,
        teacherName: params.teacherName,
        schoolName: params.schoolName,
        content: data.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [params.subject, params.grade, params.standardFormat],
      };

      setCurrentPlan(newPlan);
      setActiveTab('generator');

      // Automatically save to library for convenience
      const updatedList = [newPlan, ...savedPlans.filter(p => p.id !== newPlan.id)];
      persistPlans(updatedList);

      // Celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (error: any) {
      console.error(error);
      alert('Đã xảy ra lỗi: ' + (error.message || 'Vui lòng kiểm tra lại cấu hình API key.'));
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  const handleSaveToLibrary = (planToSave: LessonPlan) => {
    const exists = savedPlans.some((p) => p.id === planToSave.id);
    let updated: LessonPlan[];
    if (exists) {
      updated = savedPlans.map((p) => (p.id === planToSave.id ? planToSave : p));
    } else {
      updated = [planToSave, ...savedPlans];
    }
    persistPlans(updated);
    alert('Đã lưu vào thư viện bài dạy thành công!');
  };

  const handleDeletePlan = (id: string) => {
    const updated = savedPlans.filter((p) => p.id !== id);
    persistPlans(updated);
    if (currentPlan?.id === id) {
      setCurrentPlan(null);
    }
  };

  const handleDuplicatePlan = (plan: LessonPlan) => {
    const cloned: LessonPlan = {
      ...plan,
      id: 'plan-' + Date.now(),
      title: `${plan.title} (Bản sao)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persistPlans([cloned, ...savedPlans]);
    setCurrentPlan(cloned);
    setActiveTab('generator');
    alert('Đã nhân bản giáo án thành công!');
  };

  const handleSelectPlan = (plan: LessonPlan) => {
    setCurrentPlan(plan);
    setActiveTab('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCopilotWithPlan = (plan: LessonPlan, toolType?: string) => {
    setCurrentPlan(plan);
    if (toolType) {
      setCopilotInitialTool(toolType as AIToolType);
    }
    setIsCopilotOpen(true);
  };

  const handleAppendToPlan = (textToAppend: string) => {
    if (currentPlan) {
      const updated: LessonPlan = {
        ...currentPlan,
        content: currentPlan.content + textToAppend,
        updatedAt: new Date().toISOString(),
      };
      setCurrentPlan(updated);
      handleSaveToLibrary(updated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
        }}
        savedCount={savedPlans.length}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        onNewPlan={() => {
          setCurrentPlan(null);
          setActiveTab('generator');
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab 1: Generator & Lesson Viewer */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            {currentPlan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPlan(null)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại form Soạn bài mới</span>
                  </button>
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    Đang hiển thị bản thảo: <strong className="text-slate-700">{currentPlan.title}</strong>
                  </span>
                </div>

                <LessonViewer
                  plan={currentPlan}
                  onUpdatePlan={(updated) => {
                    setCurrentPlan(updated);
                    handleSaveToLibrary(updated);
                  }}
                  onSaveToLibrary={handleSaveToLibrary}
                  isSaved={savedPlans.some((p) => p.id === currentPlan.id)}
                  onOpenCopilotWithPlan={handleOpenCopilotWithPlan}
                />
              </div>
            ) : (
              <LessonGeneratorForm
                onGenerate={handleGenerate}
                isLoading={isLoading}
                loadingStage={loadingStage}
              />
            )}
          </div>
        )}

        {/* Tab 2: Saved Lessons Library */}
        {activeTab === 'library' && (
          <SavedLessonsModal
            savedPlans={savedPlans}
            onSelectPlan={handleSelectPlan}
            onDeletePlan={handleDeletePlan}
            onDuplicatePlan={handleDuplicatePlan}
            onImportPlans={(imported) => persistPlans([...imported, ...savedPlans])}
            onNewPlan={() => {
              setCurrentPlan(null);
              setActiveTab('generator');
            }}
          />
        )}

        {/* Tab 3: Preloaded Sample Lessons */}
        {activeTab === 'samples' && (
          <SampleLessonsLibrary onSelectPlan={handleSelectPlan} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>EduPlan AI • Trợ lý Sư phạm Tự Động Hóa Kế Hoạch Bài Dạy Chuẩn CV 5512 / CV 2345</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsGuidelinesOpen(true)}
              className="hover:text-indigo-600 underline transition-colors"
            >
              Quy chuẩn CV 5512
            </button>
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="hover:text-indigo-600 underline transition-colors"
            >
              Bộ công cụ Sư phạm
            </button>
            <span>Bộ GD&ĐT GDPT 2018</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TeacherCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentPlan={currentPlan}
        initialToolType={copilotInitialTool}
        onAppendToPlan={handleAppendToPlan}
      />

      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />
    </div>
  );
}
