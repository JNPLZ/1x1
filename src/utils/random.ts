export function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(0, index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}
