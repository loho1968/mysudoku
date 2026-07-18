import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyEditMode } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get(id) as any;

    if (!puzzle) {
      return NextResponse.json({ success: false, error: '题目不存在' }, { status: 404 });
    }

    const tags = db.prepare(`
      SELECT t.id, t.name, t.color FROM tags t
      JOIN puzzle_tags pt ON t.id = pt.tag_id
      WHERE pt.puzzle_id = ?
    `).all(id);

    const techniqueNames = (db.prepare(`
      SELECT technique FROM puzzle_techniques WHERE puzzle_id = ?
    `).all(id) as { technique: string }[]).map(row => row.technique);

    return NextResponse.json({
      success: true,
      data: { ...puzzle, tags, techniqueNames, _modified: undefined },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取题目失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyEditMode(request)) {
    return NextResponse.json({ success: false, error: '需要编辑模式' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { puzzle, solution, difficulty, source, remark, tagIds, techniqueNames } = body;

    const db = getDb();

    if (puzzle) {
      db.prepare(`
        UPDATE puzzles SET puzzle=?, solution=?, difficulty=?, source=?, remark=?,
        updated_at=datetime('now'), _modified=1 WHERE id=?
      `).run(puzzle, solution || null, difficulty ?? 0, source || null, remark || null, id);
    }

    if (tagIds !== undefined) {
      db.prepare('DELETE FROM puzzle_tags WHERE puzzle_id = ?').run(id);
      const insertTag = db.prepare('INSERT OR IGNORE INTO puzzle_tags (puzzle_id, tag_id) VALUES (?, ?)');
      for (const tagId of tagIds) {
        insertTag.run(id, tagId);
      }
    }

    if (techniqueNames !== undefined) {
      db.prepare('DELETE FROM puzzle_techniques WHERE puzzle_id = ?').run(id);
      const insertTech = db.prepare('INSERT OR IGNORE INTO puzzle_techniques (puzzle_id, technique) VALUES (?, ?)');
      for (const tech of techniqueNames) {
        insertTech.run(id, tech);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: '更新题目失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyEditMode(request)) {
    return NextResponse.json({ success: false, error: '需要编辑模式' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const db = getDb();
    db.prepare('DELETE FROM puzzles WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: '删除题目失败' }, { status: 500 });
  }
}
