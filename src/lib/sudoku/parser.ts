export function parsePuzzleText(text: string): string[] {
  const cleanLines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
  const puzzles: string[] = [];

  for (const line of cleanLines) {
    if (line.length === 81 && /^[0-9.]+$/.test(line)) {
      puzzles.push(line.replace(/\./g, '0'));
    }
  }

  if (puzzles.length === 0) {
    for (let i = 0; i + 8 < cleanLines.length; i += 9) {
      const chunk = cleanLines.slice(i, i + 9);
      if (
        chunk.length === 9 &&
        chunk.every(l => l.length === 9 && /^[0-9.]+$/.test(l))
      ) {
        puzzles.push(chunk.join('').replace(/\./g, '0'));
      }
    }
  }

  return puzzles;
}

export function puzzleToGrid(puzzle: string): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < 9; r++) {
    grid[r] = [];
    for (let c = 0; c < 9; c++) {
      const ch = puzzle[r * 9 + c];
      grid[r][c] = ch === '0' || ch === '.' ? 0 : parseInt(ch);
    }
  }
  return grid;
}

export function gridToPuzzle(grid: number[][]): string {
  let s = '';
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      s += grid[r][c] || '0';
  return s;
}
