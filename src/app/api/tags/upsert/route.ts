import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyEditMode } from '@/lib/utils';

/**
 * @file tags/upsert/route.ts
 * @author loho
 *
 * 批量 upsert 标签（按 ID 主键）。
 *
 * 用途：拉取/同步流程中，把标签集合整体同步到目标端。
 * - 按 ID 主键 upsert，避免按 name 冲突（不同端的同名 tag 可能 ID 不同）
 * - name 唯一约束由数据库保证；若 upsert 导致 name 冲突，单条事务会失败回滚
 *
 * 请求体：{ tags: Tag[] }
 * 权限：需要编辑模式。
 */

interface UpsertTag {
  id: string;
  name: string;
  color: string;
}

interface UpsertBody {
  tags: UpsertTag[];
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
    const { tags = [] } = body;

    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { success: false, error: '参数格式错误' },
        { status: 400 }
      );
    }

    const db = getDb();

    const upsertStmt = db.prepare(`
      INSERT INTO tags (id, name, color, created_at, updated_at)
      VALUES (@id, @name, @color, datetime('now'), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        color = excluded.color,
        updated_at = datetime('now'),
        _modified = 1
    `);

    const runTx = db.transaction(() => {
      for (const tag of tags) {
        if (!tag.id || !tag.name) continue;
        upsertStmt.run({
          id: tag.id,
          name: tag.name,
          color: tag.color || '#1890ff',
        });
      }
    });

    runTx();

    return NextResponse.json({
      success: true,
      data: { tagCount: tags.length },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '批量 upsert 标签失败' },
      { status: 500 }
    );
  }
}
