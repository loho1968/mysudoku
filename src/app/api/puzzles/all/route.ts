import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * @file puzzles/all/route.ts
 * @author loho
 *
 * 全量导出题库（含 tags + techniqueNames），不分页。
 *
 * 用途：供本地维护页面的「拉取」按钮调用——从远程服务器一次性拉取全部题目，
 * 在本地库按 ID upsert。
 *
 * 权限：
 * - 公开读取（GET，与 /api/puzzles 列表查询一致）
 * - 但建议客户端附 X-Edit-Password 头，未来可在此处开启强制校验
 */

interface RawPuzzle {
  id: string;
  puzzle: string;
  solution: string | null;
  difficulty: number;
  source: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

interface RawTag {
  id: string;
  name: string;
  color: string;
}

export async function GET(_request: NextRequest) {
  try {
    const db = getDb();

    // 1) 全量题目
    const puzzles = db.prepare(`
      SELECT id, puzzle, solution, difficulty, source, remark, created_at, updated_at
      FROM puzzles
      ORDER BY created_at ASC
    `).all() as RawPuzzle[];

    // 2) 全量标签（预读，避免 N+1 查询）
    const allTags = db.prepare('SELECT id, name, color FROM tags').all() as RawTag[];
    const tagMap = new Map(allTags.map(t => [t.id, t]));

    // 3) 全量题目-标签关联（预读）
    const allPuzzleTags = db.prepare('SELECT puzzle_id, tag_id FROM puzzle_tags').all() as {
      puzzle_id: string;
      tag_id: string;
    }[];
    const tagsByPuzzle = new Map<string, RawTag[]>();
    for (const pt of allPuzzleTags) {
      const tag = tagMap.get(pt.tag_id);
      if (!tag) continue;
      const arr = tagsByPuzzle.get(pt.puzzle_id) || [];
      arr.push(tag);
      tagsByPuzzle.set(pt.puzzle_id, arr);
    }

    // 4) 全量题目-技巧关联（预读）
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

    // 5) 拼装结果
    const list = puzzles.map(p => ({
      ...p,
      tags: tagsByPuzzle.get(p.id) || [],
      techniqueNames: techsByPuzzle.get(p.id) || [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        puzzles: list,
        tags: allTags,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '导出题库失败' },
      { status: 500 }
    );
  }
}
