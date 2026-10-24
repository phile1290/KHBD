export interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  curriculum: string;
  duration: string;
  standardFormat: 'CV5512' | 'CV2345' | 'STEM' | 'COMPACT';
  teachingMethod: string;
  teachingTools: string;
  targetAudienceProfile?: string;
  content: string; // Markdown or rich text formatted plan
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  teacherName?: string;
  schoolName?: string;
}

export interface GenerationParams {
  subject: string;
  grade: string;
  curriculum: string;
  lessonTitle: string;
  duration: string;
  teachingMethod: string;
  teachingTools: string;
  targetAudienceProfile: string;
  additionalNotes: string;
  standardFormat: 'CV5512' | 'CV2345' | 'STEM' | 'COMPACT';
  teacherName?: string;
  schoolName?: string;
}

export type AIToolType = 
  | 'generate-warmup' 
  | 'generate-worksheet' 
  | 'generate-rubric' 
  | 'generate-quiz' 
  | 'differentiated-teaching' 
  | 'improve-section';

export interface SubjectOption {
  id: string;
  name: string;
  category: 'Tự nhiên' | 'Xã hội' | 'Ngoại ngữ' | 'Năng khiếu & Khác';
  popularTopics: string[];
}
