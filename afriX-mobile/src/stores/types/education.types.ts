export type EducationModuleId =
  | "what_are_tokens"
  | "how_agents_work"
  | "understanding_value"
  | "safety_security";

export type ModuleProgress = {
  completed: boolean;
  attempts: number;
  score: number;
  completed_at?: string | null;
};

export type EducationProgress = Record<string, ModuleProgress>;

export type QuizQuestion = {
  question: string;
  options: string[];
};

export type Quiz = {
  title: string;
  totalQuestions: number;
  passingScore: number;
  questions: QuizQuestion[];
};

export type SubmitResult = {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  attempts_left: number;
  message: string;
};

export type EducationState = {
  progress: EducationProgress | null;
  loading: boolean;
  error: string | null;
  fetchProgress: () => Promise<void>;
  getQuiz: (module: string) => Promise<Quiz>;
  submitQuiz: (module: string, answers: number[]) => Promise<SubmitResult>;
};
