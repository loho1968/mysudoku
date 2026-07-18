import type { NotesGrid } from '../types';
import type { TechniqueResult } from './index';

export const hiddenSingle = {
  name: '摒除法',
  apply(grid: number[][], notes: NotesGrid): TechniqueResult {
    let changed = false;
    const newNotes: NotesGrid = notes.map(row => row.map(cell => [...cell]));

    // 关键：本轮判断全部基于入参 notes 快照，不在遍历中修改 newNotes 来影响后续判断。
    // 否则前面 num 的收窄会污染后面 num 的"唯一候选位"判断，产生连锁误判。
    // 收集本轮所有要收窄的位置，遍历结束后统一应用。
    const singles: { r: number; c: number; num: number }[] = [];
    const addSingle = (r: number, c: number, num: number) => {
      if (!singles.some(s => s.r === r && s.c === c)) singles.push({ r, c, num });
    };

    for (let num = 1; num <= 9; num++) {
      // Check each row
      for (let r = 0; r < 9; r++) {
        const positions: number[] = [];
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0 && notes[r][c].includes(num)) {
            positions.push(c);
          }
        }
        if (positions.length === 1) {
          addSingle(r, positions[0], num);
        }
      }

      // Check each column
      for (let c = 0; c < 9; c++) {
        const positions: number[] = [];
        for (let r = 0; r < 9; r++) {
          if (grid[r][c] === 0 && notes[r][c].includes(num)) {
            positions.push(r);
          }
        }
        if (positions.length === 1) {
          addSingle(positions[0], c, num);
        }
      }

      // Check each box
      for (let br = 0; br < 9; br += 3) {
        for (let bc = 0; bc < 9; bc += 3) {
          const positions: [number, number][] = [];
          for (let r = br; r < br + 3; r++) {
            for (let c = bc; c < bc + 3; c++) {
              if (grid[r][c] === 0 && notes[r][c].includes(num)) {
                positions.push([r, c]);
              }
            }
          }
          if (positions.length === 1) {
            const [r, c] = positions[0];
            addSingle(r, c, num);
          }
        }
      }
    }

    // 统一应用：把命中格的候选收窄为对应的唯一数字
    for (const { r, c, num } of singles) {
      if (newNotes[r][c].length !== 1 || newNotes[r][c][0] !== num) {
        newNotes[r][c] = [num];
        changed = true;
      }
    }

    return { notes: newNotes, changed };
  },
};
