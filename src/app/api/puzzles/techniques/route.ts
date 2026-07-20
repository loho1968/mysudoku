import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * @file route.ts
 * @author loho
 *
 * 技巧聚合查询 API：GET /api/puzzles/techniques
 *
 * 返回题库中各技巧的题目数量（去重排序），
 * 供前端 TechniquePicker 展示"哪些技巧有几道题可练"。
 */

interface TechniqueCount {
  technique: string;
  count: number;
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT technique, COUNT(*) as count
         FROM puzzle_techniques
         GROUP BY technique
         ORDER BY technique`
      )
      .all() as TechniqueCount[];

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "获取技巧列表失败" },
      { status: 500 }
    );
  }
}
