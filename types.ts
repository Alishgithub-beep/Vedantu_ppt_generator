
export type SlideType = 'TITLE' | 'CONTENT' | 'QUIZ';

export interface QuizData {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Slide {
  id: string;
  type: SlideType;
  title: string;
  content: string;
  keyPoints: string[];
  imagePrompt?: string;
  imageUrl?: string;
  quizData?: QuizData;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  accentColor: string;
}

export interface ChapterContent {
  chapterTitle: string;
  subject: string;
  slides: Slide[];
  theme: ThemeConfig;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING_CONTENT = 'GENERATING_CONTENT',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  VIEWING_DECK = 'VIEWING_DECK'
}
