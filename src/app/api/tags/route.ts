import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyEditMode, generateId } from '@/lib/utils';

export async function GET() {
  try {
    const db = getDb();
    const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取标签失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyEditMode(request)) {
    return NextResponse.json({ success: false, error: '需要编辑模式' }, { status: 403 });
  }

  try {
    const { name, color = '#1890ff' } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: '标签名称不能为空' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get(name.trim());
    if (existing) {
      return NextResponse.json({ success: false, error: '标签名称已存在' }, { status: 409 });
    }

    const id = generateId();
    db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)').run(id, name.trim(), color);

    return NextResponse.json({ success: true, data: { id, name: name.trim(), color } });
  } catch (error) {
    return NextResponse.json({ success: false, error: '添加标签失败' }, { status: 500 });
  }
}
