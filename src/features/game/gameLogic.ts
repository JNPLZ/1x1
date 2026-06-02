import type { GameSession, Task } from '../../types/game';
import { randomInteger, shuffle } from '../../utils/random';

export const TABLE_MIN = 1;
export const TABLE_MAX = 10;
export const FACTOR_MIN = 1;
export const FACTOR_MAX = 10;
export const TASK_COUNT = 20;
export const MAX_POINTS_PER_TASK = 10;
export const POINT_PENALTY = 2;

export function createTaskList(): Task[] {
  const requiredFactors = Array.from(
    { length: FACTOR_MAX },
    (_, index) => index + FACTOR_MIN,
  );
  const randomFactors = Array.from(
    { length: TASK_COUNT - requiredFactors.length },
    () => randomInteger(FACTOR_MIN, FACTOR_MAX),
  );

  return shuffle([...requiredFactors, ...randomFactors]).map((factor) => ({
    factor,
  }));
}

export function createAnswerList(table: number): number[] {
  return shuffle(
    Array.from({ length: FACTOR_MAX }, (_, index) => table * (index + 1)),
  );
}

export function createSession(table: number): GameSession {
  const tasks = createTaskList();

  return {
    table,
    tasks,
    answers: createAnswerList(table),
    currentIndex: 0,
    score: 0,
    misses: 0,
    displayFactor: tasks[0]?.factor ?? 1,
    isRolling: true,
    isLocked: false,
    lastWrongAnswer: null,
    feedback: 'Gleich geht es los.',
    feedbackTone: 'neutral',
  };
}

export function getCurrentTask(session: GameSession): Task {
  return session.tasks[session.currentIndex];
}

export function getCorrectAnswer(session: GameSession): number {
  return session.table * getCurrentTask(session).factor;
}

export function getAvailablePoints(misses: number): number {
  return Math.max(MAX_POINTS_PER_TASK - misses * POINT_PENALTY, 0);
}

export function getStars(score: number): number {
  if (score >= 150) {
    return 3;
  }

  if (score >= 100) {
    return 2;
  }

  return 1;
}
