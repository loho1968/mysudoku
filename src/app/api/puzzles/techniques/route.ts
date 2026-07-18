import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * @file route.ts
 * @author loho
 *
 * 技巧聚合查询 API：GET /api/puzzles/techniques
 *
 * 返回题库中已有题目关联的技巧名列表（去重排序），
 * 供前端 TechniquePicker 展示"哪些技巧有题目可练"。
 */
export async function GET() {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT DISTINCT technique FROM puzzle_techniques ORDER BY technique"
      )
      .all() as { technique: string }[];

    const data = rows.map((r) => r.technique);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "获取技巧列表失败" },
      { status: 500 }
    );
  }
}
