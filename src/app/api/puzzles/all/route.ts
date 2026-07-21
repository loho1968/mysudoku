import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * @file puzzles/all/route.ts
 * @author loho
 *
 * 全量导出题库（含 techniqueNames），不分页。
 *
 * 用途：供本地维护页面的「拉取」按钮调用——从远程服务器一次性拉取全部题目，
 * 在本地库按 ID upsert。
 *
 * 权限：公开读取。
 */

interface RawPuzzle {
  id: string;
  puzzle: string;
  solution: string | null;
  difficulty: number;
  remark: string | null;
  seq: number | null;
  created_at: string;
  updated_at: string;
}

export async function GET(_request: NextRequest) {
  try {
    const db = getDb();

    // 1) 全量题目（按 seq 排序，便于显示）
    const puzzles = db.prepare(`
      SELECT id, puzzle, solution, difficulty, remark, seq, created_at, updated_at
      FROM puzzles
      ORDER BY seq ASC
    `).all() as RawPuzzle[];

    // 2) 全量关联的技巧
    const allPuzzleTechs = db.prepare('SELECT puzzle_id, technique FROM puzzle_techniques').all() as {
      puzzle_id: string;
      technique: string;
    }[];
    const techsByPuzzle = new Map<string, string[]>();
    for (const pt of allPuzzleTechs) {
      const arr = techsByPuzzle.get(pt.puzzle_id) || [];
      arr.push(pt.technique);
      techsByPuzzle.set(pt.puzzle_id, arr);
    }

    // 3) 拼装结果
    const list = puzzles.map(p => ({
      ...p,
      techniqueNames: techsByPuzzle.get(p.id) || [],
    }));

    return NextResponse.json({
      success: true,
      data: { puzzles: list },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '导出题库失败' },
      { status: 500 }
    );
  }
}
