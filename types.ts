export interface PpctLesson {
    week: string;
    weekNumber?: number;
    lessonName: string;
    periods: number;
    periodIndex?: number;
    periodLabel?: string;
    formattedLessonName?: string;
    notes?: string;
}

export interface WeekPlanItem {
    id: string;
    week: string;
    lessonName: string;
    periods: number;
    notes?: string;
    periodIndexInLesson?: number;
    totalPeriodsInLesson?: number;
    baseLessonName?: string;
    pedagogicalNote?: string;
    status: 'idle' | 'generating' | 'completed' | 'error';
    error?: string;
    result?: LessonPlanResponse;
}

export interface LessonRow {
    teacher: string;
    student: string;
}

export interface Activity {
    time: string;
    name: string;
    topic?: string;
    rows: LessonRow[];
}

export interface Period {
    period_number: number;
    objectives: string[];
    materials: {
        teacher: string;
        student: string;
    };
    activities: Activity[];
}

export interface LessonPlanResponse {
    lesson_full_title: string;
    week: string;
    grade_class: string;
    subject?: string;
    date_range: string;
    periods: Period[];
}

export interface InputState {
    week: string;
    subject: string;
    grade: string;
    periods: string;
    duration: string;
    lessonName: string;
    context: string;
    integrateDigitalSkills: boolean;
    integrateAI: boolean;
    integrationNotes: string;
    additionalIntegrationNotes: string;
    schoolName?: string;
    teacherName?: string;
    periodIndexInLesson?: number;
    totalPeriodsInLesson?: number;
    baseLessonName?: string;
    pedagogicalNote?: string;
}

export interface ImageFile {
    file: File;
    previewUrl: string;
}

export type SourceType = 'image' | 'pdf';

// --- TYPES DÀNH CHO TAB KẾ HOẠCH DẠY HỌC (KHDH) ---
export interface KhdhRow {
    id: string;
    week: string;           // Ví dụ: "Tuần 8"
    dayAndDate: string;     // Cột 1: "Thứ, ngày" (Ví dụ: "Hai 19/10", "Ba 20/10"...)
    session: string;        // Cột 2: "Buổi" (Ví dụ: "Sáng", "Chiều")
    period: number | string;// Cột 3: "Tiết" (Ví dụ: 1, 2, 3, 4...)
    className: string;      // Cột 4: "LỚP" (Ví dụ: "5C", "5A", "4A", "3E"...)
    subject: string;        // Cột 5: "MÔN" (Ví dụ: "KNS", "CN", "TH", "Tin học", "Công nghệ"...)
    lessonName: string;     // Cột 6: "Tên bài dạy" (Tự động điền từ PPCT của môn và lớp trong tuần đó)
    notes?: string;         // Cột 7: "Ghi chú" (Chỉ điền nếu trong PPCT môn đó, tuần đó có ghi chú)
    
    // Thuộc tính tương thích bổ sung
    dayOfWeek?: string;     
    date?: string;          
    grade?: string;         
    periodNumber?: number | string;
    duration?: number | string;
    equipment?: string;     
}

export interface KhdhSubjectData {
    subject: string;
    grade?: string;
    fileName: string;
    lessons: PpctLesson[];
}

export interface KhdhPlan {
    title: string;
    weekNumber: number | string; // Ví dụ: 8 hoặc "Tuần 8"
    dateRange?: string;          // Ví dụ: "(Từ ngày 19/10 đến 22/10/2026)"
    schoolName: string;
    teacherName: string;
    academicYear?: string;
    gradeClass?: string;
    layoutOrientation?: 'portrait' | 'landscape';
    templateName?: string;
    rows: KhdhRow[];
}