import type { NotesGrid } from '../types';
import type { TechniqueResult } from './index';

export const nakedSingle = {
  name: '唯余法',
  apply(grid: number[][], notes: NotesGrid): TechniqueResult {
    let changed = false;
    const newNotes: NotesGrid = notes.map(row => row.map(cell => [...cell]));
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] !== 0) continue;
        if (newNotes[r][c].length === 1) {
          changed = true;
        }
      }
    }
    return { notes: newNotes, changed };
  },
};
