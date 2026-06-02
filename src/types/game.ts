export type GameScreen = 'start' | 'game' | 'result';

export type FeedbackTone = 'neutral' | 'success' | 'error' | 'reveal';

export type GameMode = 'random' | 'explosion';

export interface Task {
  factor: number;
}

export interface GameSession {
  mode: GameMode;
  table: number;
  tasks: Task[];
  answers: number[];
  meteorHits: Record<number, number>;
  currentIndex: number;
  score: number;
  misses: number;
  displayFactor: number;
  isRolling: boolean;
  isLocked: boolean;
  isShipShaking: boolean;
  lastWrongAnswer: number | null;
  feedback: string;
  feedbackTone: FeedbackTone;
}
