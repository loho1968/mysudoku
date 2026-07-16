import { getBoxStart } from './board';

export function isValid(grid: number[][], row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) return false;
  }
  const br = getBoxStart(row);
  const bc = getBoxStart(col);
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === num) return false;
    }
  }
  return true;
}

export function hasErrors(grid: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (val === 0) continue;
      if (!isValid(grid, r, c, val)) return true;
    }
  }
  return false;
}

export function isComplete(grid: number[][]): boolean {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (grid[r][c] === 0) return false;
  return !hasErrors(grid);
}
