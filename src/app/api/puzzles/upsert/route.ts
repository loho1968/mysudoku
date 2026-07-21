import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyEditMode } from '@/lib/utils';

/**
 * @file puzzles/upsert/route.ts
 * @author loho
 *
 * 批量 upsert 题目（按 ID 主键），含 techniqueNames 关联。
 *
 * 用途：
 * - 「拉取」：把从远程服务器拉到的题目数据 upsert 进本地库
 * - 「同步」：把本机题库推到远程服务器（服务器端执行 upsert）
 *
 * 请求体：{ puzzles: Puzzle[] }
 * - 主表用 INSERT OR REPLACE，技巧关联表先 DELETE 再 INSERT（重建）
 *
 * 权限：需要编辑模式（verifyEditMode）。
 */

interface UpsertPuzzle {
  id: string;
  puzzle: string;
  solution: string | null;
  difficulty: number;
  remark: string | null;
  seq?: number | null;
  created_at?: string;
  updated_at?: string;
  techniqueNames?: string[];
}

interface UpsertBody {
  puzzles: UpsertPuzzle[];
}

export async function POST(request: NextRequest) {
  if (!verifyEditMode(request)) {
    return NextResponse.json(
      { success: false, error: '需要编辑模式' },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as UpsertBody;
    const { puzzles = [] } = body;

    if (!Array.isArray(puzzles)) {
      return NextResponse.json(
        { success: false, error: '参数格式错误' },
        { status: 400 }
      );
    }

    const db = getDb();

    const upsertPuzzleStmt = db.prepare(`
      INSERT INTO puzzles (id, puzzle, solution, difficulty, remark, seq, created_at, updated_at)
      VALUES (@id, @puzzle, @solution, @difficulty, @remark, @seq,
        COALESCE(@created_at, datetime('now')), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        puzzle = excluded.puzzle,
        solution = excluded.solution,
        difficulty = excluded.difficulty,
        remark = excluded.remark,
        seq = COALESCE(excluded.seq, puzzles.seq),
        updated_at = datetime('now'),
        _modified = 1
    `);
    const deletePuzzleTechsStmt = db.prepare('DELETE FROM puzzle_techniques WHERE puzzle_id = ?');
    const insertPuzzleTechStmt = db.prepare(
      'INSERT OR IGNORE INTO puzzle_techniques (puzzle_id, technique) VALUES (?, ?)'
    );

    const runTx = db.transaction(() => {
      for (const p of puzzles) {
        if (!p.id || !p.puzzle || p.puzzle.length !== 81) continue;

        // 若未提供 seq，分配新序号（仅对新增记录）
        let seq = p.seq ?? null;
        if (seq === null) {
          const exists = db.prepare("SELECT 1 FROM puzzles WHERE id = ?").get(p.id);
          if (!exists) {
            const maxRow = db.prepare("SELECT COALESCE(MAX(seq), 0) AS maxSeq FROM puzzles").get() as { maxSeq: number };
            seq = maxRow.maxSeq + 1;
          }
        }

        upsertPuzzleStmt.run({
          id: p.id,
          puzzle: p.puzzle,
          solution: p.solution ?? null,
          difficulty: p.difficulty ?? 0,
          remark: p.remark ?? null,
          seq,
          created_at: p.created_at ?? null,
        });

        // 重建 techniques 关联
        deletePuzzleTechsStmt.run(p.id);
        for (const tech of p.techniqueNames || []) {
          if (tech) insertPuzzleTechStmt.run(p.id, tech);
        }
      }
    });

    runTx();

    return NextResponse.json({
      success: true,
      data: { puzzleCount: puzzles.length },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '批量 upsert 题目失败' },
      { status: 500 }
    );
  }
}
