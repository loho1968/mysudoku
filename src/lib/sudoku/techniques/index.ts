import { nakedSingle } from './nakedSingle';
import { hiddenSingle } from './hiddenSingle';
import { pointingPair } from './pointingPair';
import { boxLineReduction } from './boxLineReduction';
import type { NotesGrid } from '../types';

export type TechniqueResult = { notes: NotesGrid; changed: boolean };

const techniques = [nakedSingle, hiddenSingle, pointingPair, boxLineReduction];

export function applySmartNotes(grid: number[][], currentNotes?: NotesGrid): NotesGrid {
  const { getAllCandidates } = require('../candidates');
  let notes = currentNotes ? currentNotes.map(row => row.map(cell => [...cell])) : getAllCandidates(grid);
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 10) {
    changed = false;
    for (const technique of techniques) {
      const result = technique.apply(grid, notes);
      if (result.changed) {
        notes = result.notes;
        changed = true;
      }
    }
    iterations++;
  }
  return notes;
}
