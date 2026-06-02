export type GameScreen = 'start' | 'game' | 'result';

export type FeedbackTone = 'neutral' | 'success' | 'error' | 'reveal';

export interface Task {
  factor: number;
}

export interface GameSession {
  table: number;
  tasks: Task[];
  answers: number[];
  currentIndex: number;
  score: number;
  misses: number;
  displayFactor: number;
  isRolling: boolean;
  isLocked: boolean;
  lastWrongAnswer: number | null;
  feedback: string;
  feedbackTone: FeedbackTone;
}
