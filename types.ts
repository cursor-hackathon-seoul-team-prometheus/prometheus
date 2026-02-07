export enum AppStep {
  HOME = 'HOME',
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  REFINE = 'REFINE',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT',
  PRESENTATION = 'PRESENTATION'
}

export interface Question {
  id: string;
  question: string;
  context: string;
  type: 'text' | 'choice';
  options?: string[];
}

export interface SyllabusAnalysis {
  missingInfo: boolean;
  summary: string;
  questions: Question[];
}

export interface Answer {
  questionId: string;
  questionText: string;
  answer: string;
}

export interface SavedLecture {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}