export function createEmptyGrid(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

export function cloneGrid(grid: number[][]): number[][] {
  return grid.map(row => [...row]);
}

export function getBoxStart(index: number): number {
  return Math.floor(index / 3) * 3;
}

export function forEachCell(
  fn: (row: number, col: number) => void
): void {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      fn(r, c);
}
