import { getBoxStart } from '../board';
import type { NotesGrid } from '../types';
import type { TechniqueResult } from './index';

export const hiddenSingle = {
  name: '摒除法',
  apply(grid: number[][], notes: NotesGrid): TechniqueResult {
    let changed = false;
    const newNotes: NotesGrid = notes.map(row => row.map(cell => [...cell]));

    for (let num = 1; num <= 9; num++) {
      // Check each row
      for (let r = 0; r < 9; r++) {
        const positions: number[] = [];
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0 && newNotes[r][c].includes(num)) {
            positions.push(c);
          }
        }
        if (positions.length === 1) {
          newNotes[r][positions[0]] = [num];
          changed = true;
        }
      }

      // Check each column
      for (let c = 0; c < 9; c++) {
        const positions: number[] = [];
        for (let r = 0; r < 9; r++) {
          if (grid[r][c] === 0 && newNotes[r][c].includes(num)) {
            positions.push(r);
          }
        }
        if (positions.length === 1) {
          newNotes[positions[0]][c] = [num];
          changed = true;
        }
      }

      // Check each box
      for (let br = 0; br < 9; br += 3) {
        for (let bc = 0; bc < 9; bc += 3) {
          const positions: [number, number][] = [];
          for (let r = br; r < br + 3; r++) {
            for (let c = bc; c < bc + 3; c++) {
              if (grid[r][c] === 0 && newNotes[r][c].includes(num)) {
                positions.push([r, c]);
              }
            }
          }
          if (positions.length === 1) {
            const [r, c] = positions[0];
            newNotes[r][c] = [num];
            changed = true;
          }
        }
      }
    }

    return { notes: newNotes, changed };
  },
};
