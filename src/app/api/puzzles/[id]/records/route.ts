import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

/**
 * 记录一次做题结果。
 * 权限：公开（任何人做题后都可保存自己的记录）。
 *
 * 请求体字段（均选填，按需传入）：
 * - time_seconds: 用时（秒）
 * - completed: 是否完成（true/false）
 * - hint_used: 使用提示次数
 * - check_errors: 检查错误次数
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      time_seconds = null,
      completed = false,
      hint_used = 0,
      check_errors = 0,
    } = body;

    const db = getDb();

    // 校验题目存在
    const puzzle = db
      .prepare("SELECT id FROM puzzles WHERE id = ?")
      .get(id);
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: "题目不存在" },
        { status: 404 }
      );
    }

    const recordId = generateId();
    db.prepare(`
      INSERT INTO game_records
        (id, puzzle_id, time_seconds, completed, hint_used, check_errors, finished_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      recordId,
      id,
      time_seconds,
      completed ? 1 : 0,
      hint_used,
      check_errors
    );

    return NextResponse.json({ success: true, data: { id: recordId } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "记录做题结果失败" },
      { status: 500 }
    );
  }
}
