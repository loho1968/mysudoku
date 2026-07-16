import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyEditMode, generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || '';
    const tagId = searchParams.get('tagId') || '';
    const difficulty = searchParams.get('difficulty') || '';

    const db = getDb();
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (keyword) {
      where += ' AND p.puzzle LIKE ?';
      params.push(`%${keyword}%`);
    }
    if (tagId) {
      where += ' AND p.id IN (SELECT puzzle_id FROM puzzle_tags WHERE tag_id = ?)';
      params.push(tagId);
    }
    if (difficulty !== '') {
      where += ' AND p.difficulty = ?';
      params.push(parseInt(difficulty));
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM puzzles p ${where}`).get(...params) as { total: number };
    const offset = (page - 1) * pageSize;

    const puzzles = db.prepare(`
      SELECT p.* FROM puzzles p ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as any[];

    const list = puzzles.map(p => {
      const tags = db.prepare(`
        SELECT t.id, t.name, t.color
        FROM tags t
        JOIN puzzle_tags pt ON t.id = pt.tag_id
        WHERE pt.puzzle_id = ?
      `).all(p.id) as { id: string; name: string; color: string }[];

      return { ...p, tags, _modified: undefined };
    });

    return NextResponse.json({
      success: true,
      data: { list, total: countRow.total, page, pageSize },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取题目列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyEditMode(request)) {
    return NextResponse.json({ success: false, error: '需要编辑模式' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { puzzle, solution, difficulty = 0, source = null, remark = null, tagIds = [] } = body;

    if (!puzzle || puzzle.length !== 81) {
      return NextResponse.json({ success: false, error: '题目格式不正确(需要81字符)' }, { status: 400 });
    }

    const db = getDb();
    const id = generateId();

    db.prepare(`
      INSERT INTO puzzles (id, puzzle, solution, difficulty, source, remark)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, puzzle, solution || null, difficulty, source, remark);

    if (tagIds.length > 0) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO puzzle_tags (puzzle_id, tag_id) VALUES (?, ?)');
      for (const tagId of tagIds) {
        insertTag.run(id, tagId);
      }
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return NextResponse.json({ success: false, error: '添加题目失败' }, { status: 500 });
  }
}
