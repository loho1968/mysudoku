import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyEditMode, generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || '';
    const difficulty = searchParams.get('difficulty') || '';

    const db = getDb();
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (keyword) {
      where += ' AND p.puzzle LIKE ?';
      params.push(`%${keyword}%`);
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
      const techniqueNames = (db.prepare(`
        SELECT technique FROM puzzle_techniques WHERE puzzle_id = ?
      `).all(p.id) as { technique: string }[]).map(row => row.technique);

      return { ...p, techniqueNames, _modified: undefined };
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
    const { puzzle, solution, difficulty = 0, remark = null, techniqueNames = [] } = body;

    if (!puzzle || puzzle.length !== 81) {
      return NextResponse.json({ success: false, error: '题目格式不正确(需要81字符)' }, { status: 400 });
    }

    const db = getDb();
    const id = generateId();

    db.prepare(`
      INSERT INTO puzzles (id, puzzle, solution, difficulty, remark)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, puzzle, solution || null, difficulty, remark);

    if (techniqueNames.length > 0) {
      const insertTech = db.prepare('INSERT OR IGNORE INTO puzzle_techniques (puzzle_id, technique) VALUES (?, ?)');
      for (const tech of techniqueNames) {
        insertTech.run(id, tech);
      }
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return NextResponse.json({ success: false, error: '添加题目失败' }, { status: 500 });
  }
}
