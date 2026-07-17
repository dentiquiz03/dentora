export type UserRole = "admin" | "learner";
export type QuestionType = "single_best_answer" | "multiple_select" | "true_false";
export type Difficulty = "foundation" | "standard" | "advanced";
export type SessionMode = "practice" | "exam";

export interface Profile {
  id: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Subject { id: string; name: string; slug: string; icon: string | null; }
export interface Topic { id: string; subject_id: string; name: string; slug: string; }

export interface SessionOption {
  id: string;
  label: string;
  option_text: string;
  image_url?: string | null;
}

export interface SessionQuestion {
  id: string;
  position: number;
  question_type: QuestionType;
  stem: string;
  clinical_vignette?: string | null;
  image_url?: string | null;
  difficulty: Difficulty;
  subject_name?: string | null;
  topic_name?: string | null;
  options: SessionOption[];
  selected_option_ids?: string[];
  answered?: boolean;
  flagged?: boolean;
}

export interface SessionPayload {
  session: {
    id: string;
    mode: SessionMode;
    title: string;
    status: "active" | "completed" | "abandoned";
    time_limit_minutes: number | null;
    started_at: string;
    current_position: number;
  };
  questions: SessionQuestion[];
}

export interface AnswerResult {
  is_correct: boolean;
  correct_option_ids: string[];
  explanation: string;
  learning_point: string | null;
  reference_text: string | null;
  accuracy: number;
  answered_count: number;
  total_count: number;
}
