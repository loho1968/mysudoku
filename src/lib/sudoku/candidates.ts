import { getBoxStart } from './board';
import type { NotesGrid } from './types';

export function getCandidates(
  grid: number[][],
  row: number,
  col: number
): Set<number> {
  const candidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let c = 0; c < 9; c++) candidates.delete(grid[row][c]);
  for (let r = 0; r < 9; r++) candidates.delete(grid[r][col]);
  const br = getBoxStart(row);
  const bc = getBoxStart(col);
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      candidates.delete(grid[r][c]);
  return candidates;
}

export function getAllCandidates(grid: number[][]): NotesGrid {
  const notes: NotesGrid = [];
  for (let r = 0; r < 9; r++) {
    notes[r] = [];
    for (let c = 0; c < 9; c++) {
      notes[r][c] = grid[r][c] !== 0 ? [] : Array.from(getCandidates(grid, r, c));
    }
  }
  return notes;
}

export function candidatesToArray(candidates: Set<number>): number[] {
  return Array.from(candidates).sort();
}
