import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyEditMode } from '@/lib/utils';

/**
 * @file puzzles/upsert/route.ts
 * @author loho
 *
 * 批量 upsert 题目（按 ID 主键），含 tags / techniqueNames 关联。
 *
 * 用途：
 * - 「拉取」：把从远程服务器拉到的题目数据 upsert 进本地库
 * - 「同步」：把本机题库推到远程服务器（服务器端执行 upsert）
 *
 * 请求体：{ puzzles: Puzzle[], tags?: Tag[] }
 * - tags 为可选；若提供，会先 upsert 标签（保证 puzzles 关联的外键存在）
 * - 主表用 INSERT OR REPLACE，关联表先 DELETE 再 INSERT（重建）
 *
 * 权限：需要编辑模式（verifyEditMode）。
 * - 本地调用：apiFetch 自动附加 X-Local-Dev，服务端旁路放行
 * - 跨域同步：客户端附加 X-Edit-Password，服务端密码鉴权
 */

interface UpsertTag {
  id: string;
  name: string;
  color: string;
}

interface UpsertPuzzle {
  id: string;
  puzzle: string;
  solution: string | null;
  difficulty: number;
  source: string | null;
  remark: string | null;
  created_at?: string;
  updated_at?: string;
  tags?: UpsertTag[];
  techniqueNames?: string[];
}

interface UpsertBody {
  puzzles: UpsertPuzzle[];
  tags?: UpsertTag[];
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
    const { puzzles = [], tags = [] } = body;

    if (!Array.isArray(puzzles) || !Array.isArray(tags)) {
      return NextResponse.json(
        { success: false, error: '参数格式错误' },
        { status: 400 }
      );
    }

    const db = getDb();

    // 预编译语句
    const upsertTagStmt = db.prepare(`
      INSERT INTO tags (id, name, color, created_at, updated_at)
      VALUES (@id, @name, @color, datetime('now'), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        color = excluded.color,
        updated_at = datetime('now'),
        _modified = 1
    `);
    const upsertPuzzleStmt = db.prepare(`
      INSERT INTO puzzles (id, puzzle, solution, difficulty, source, remark, created_at, updated_at)
      VALUES (@id, @puzzle, @solution, @difficulty, @source, @remark,
        COALESCE(@created_at, datetime('now')), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        puzzle = excluded.puzzle,
        solution = excluded.solution,
        difficulty = excluded.difficulty,
        source = excluded.source,
        remark = excluded.remark,
        updated_at = datetime('now'),
        _modified = 1
    `);
    const deletePuzzleTagsStmt = db.prepare('DELETE FROM puzzle_tags WHERE puzzle_id = ?');
    const insertPuzzleTagStmt = db.prepare(
      'INSERT OR IGNORE INTO puzzle_tags (puzzle_id, tag_id) VALUES (?, ?)'
    );
    const deletePuzzleTechsStmt = db.prepare('DELETE FROM puzzle_techniques WHERE puzzle_id = ?');
    const insertPuzzleTechStmt = db.prepare(
      'INSERT OR IGNORE INTO puzzle_techniques (puzzle_id, technique) VALUES (?, ?)'
    );

    const runTx = db.transaction(() => {
      // 1) 先 upsert 标签（puzzles 关联可能引用这些 tag_id）
      for (const tag of tags) {
        if (!tag.id || !tag.name) continue;
        upsertTagStmt.run({
          id: tag.id,
          name: tag.name,
          color: tag.color || '#1890ff',
        });
      }

      // 2) upsert 题目主表 + 关联表
      for (const p of puzzles) {
        if (!p.id || !p.puzzle || p.puzzle.length !== 81) continue;

        upsertPuzzleStmt.run({
          id: p.id,
          puzzle: p.puzzle,
          solution: p.solution ?? null,
          difficulty: p.difficulty ?? 0,
          source: p.source ?? null,
          remark: p.remark ?? null,
          created_at: p.created_at ?? null,
        });

        // 重建 tags 关联（tags 可能不在本次 upsert 的 tags 数组里，需确保存在）
        deletePuzzleTagsStmt.run(p.id);
        for (const tag of p.tags || []) {
          // 若 tags 数组未包含此 tag，先 upsert 保证外键存在
          if (!tags.some(t => t.id === tag.id) && tag.id && tag.name) {
            upsertTagStmt.run({
              id: tag.id,
              name: tag.name,
              color: tag.color || '#1890ff',
            });
          }
          insertPuzzleTagStmt.run(p.id, tag.id);
        }

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
      data: {
        puzzleCount: puzzles.length,
        tagCount: tags.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '批量 upsert 题目失败' },
      { status: 500 }
    );
  }
}
