import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyEditMode } from '@/lib/utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyEditMode(request)) {
    return NextResponse.json({ success: false, error: '需要编辑模式' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { name, color } = await request.json();

    const db = getDb();
    if (name) {
      const existing = db.prepare('SELECT id FROM tags WHERE name = ? AND id != ?').get(name.trim(), id);
      if (existing) {
        return NextResponse.json({ success: false, error: '标签名称已存在' }, { status: 409 });
      }
    }

    db.prepare(`
      UPDATE tags SET name=COALESCE(?, name), color=COALESCE(?, color),
      updated_at=datetime('now'), _modified=1 WHERE id=?
    `).run(name?.trim() || null, color || null, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: '更新标签失败' }, { status: 500 });
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
    db.prepare('DELETE FROM puzzle_tags WHERE tag_id = ?').run(id);
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: '删除标签失败' }, { status: 500 });
  }
}
