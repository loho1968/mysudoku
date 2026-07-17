import type { NotesGrid } from '../types';
import type { TechniqueResult } from './index';

// 区块删减法（Box-Line Reduction / Claiming）：Pointing 的逆操作。
// 若某行(列)中某数字的候选全部落在同一个宫内，则可删除该宫其余格的该候选。
export const boxLineReduction = {
  name: '区块删减(Box-Line)',
  apply(grid: number[][], notes: NotesGrid): TechniqueResult {
    let changed = false;
    const newNotes: NotesGrid = notes.map(row => row.map(cell => [...cell]));

    // 行 -> 区块
    for (let num = 1; num <= 9; num++) {
      for (let r = 0; r < 9; r++) {
        const cols: number[] = [];
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0 && newNotes[r][c].includes(num)) cols.push(c);
        }
        if (cols.length === 0) continue;
        const boxes = new Set(cols.map(c => Math.floor(c / 3)));
        if (boxes.size === 1) {
          const bc = boxes.values().next().value!;
          const br = Math.floor(r / 3);
          for (let rr = br * 3; rr < br * 3 + 3; rr++) {
            for (let cc = bc * 3; cc < bc * 3 + 3; cc++) {
              if (rr === r) continue;
              if (newNotes[rr][cc].includes(num)) {
                newNotes[rr][cc] = newNotes[rr][cc].filter(x => x !== num);
                changed = true;
              }
            }
          }
        }
      }
    }

    // 列 -> 区块
    for (let num = 1; num <= 9; num++) {
      for (let c = 0; c < 9; c++) {
        const rows: number[] = [];
        for (let r = 0; r < 9; r++) {
          if (grid[r][c] === 0 && newNotes[r][c].includes(num)) rows.push(r);
        }
        if (rows.length === 0) continue;
        const boxes = new Set(rows.map(r => Math.floor(r / 3)));
        if (boxes.size === 1) {
          const br = boxes.values().next().value!;
          const bc = Math.floor(c / 3);
          for (let rr = br * 3; rr < br * 3 + 3; rr++) {
            for (let cc = bc * 3; cc < bc * 3 + 3; cc++) {
              if (cc === c) continue;
              if (newNotes[rr][cc].includes(num)) {
                newNotes[rr][cc] = newNotes[rr][cc].filter(x => x !== num);
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
