import { getBoxStart } from '../board';
import type { NotesGrid } from '../types';
import type { TechniqueResult } from './index';

export const pointingPair = {
  name: '区块删减(Pointing)',
  apply(grid: number[][], notes: NotesGrid): TechniqueResult {
    let changed = false;
    const newNotes: NotesGrid = notes.map(row => row.map(cell => [...cell]));

    for (let num = 1; num <= 9; num++) {
      for (let br = 0; br < 9; br += 3) {
        for (let bc = 0; bc < 9; bc += 3) {
          const rows = new Set<number>();
          const cols = new Set<number>();

          for (let r = br; r < br + 3; r++) {
            for (let c = bc; c < bc + 3; c++) {
              if (grid[r][c] === 0 && newNotes[r][c].includes(num)) {
                rows.add(r);
                cols.add(c);
              }
            }
          }

          // If all candidates in same row, remove from other cols in that row
          if (rows.size === 1) {
            const r = rows.values().next().value!;
            for (let c = 0; c < 9; c++) {
              if (c >= bc && c < bc + 3) continue;
              if (newNotes[r][c].includes(num)) {
                newNotes[r][c] = newNotes[r][c].filter(x => x !== num);
                changed = true;
              }
            }
          }

          // If all candidates in same col, remove from other rows in that col
          if (cols.size === 1) {
            const c = cols.values().next().value!;
            for (let r = 0; r < 9; r++) {
              if (r >= br && r < br + 3) continue;
              if (newNotes[r][c].includes(num)) {
                newNotes[r][c] = newNotes[r][c].filter(x => x !== num);
                changed = true;
              }
            }
          }
        }
      }
    }

    return { notes: newNotes, changed };
  },
};
