import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * @file route.ts
 * @author loho
 *
 * 随机出题 API：GET /api/puzzles/random
 *
 * 参数（全部可选）：
 *  - difficulty: number  1=简单/2=中等/3=困难（缺省时不按难度过滤）
 *  - exclude: string     逗号分隔的已做完题目 id，优先排除
 *  - techniques: string  逗号分隔的技巧名，多技巧"与"过滤（题目须同时含全部技巧）
 *
 * 退化策略：先按全部条件筛选，无结果则逐步放宽（去排除 → 去技巧 → 去难度），
 * 保证总能出题（除非题库完全为空）。
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");
    const excludeRaw = searchParams.get("exclude") || "";
    const techniquesRaw = searchParams.get("techniques") || "";

    const diff = difficulty ? parseInt(difficulty, 10) : null;
    if (difficulty && (diff === null || diff < 1 || diff > 4)) {
      return NextResponse.json(
        { success: false, error: "difficulty 取值范围 1-4" },
        { status: 400 }
      );
    }

    const excludeIds = excludeRaw
      ? excludeRaw.split(",").filter(Boolean)
      : [];
    const techniqueList = techniquesRaw
      ? techniquesRaw.split(",").filter(Boolean)
      : [];

    const db = getDb();

    /** 带 techniqueNames 的查询结果包装。 */
    function attachMeta(row: Record<string, unknown>) {
      const techniqueNames = (
        db
          .prepare("SELECT technique FROM puzzle_techniques WHERE puzzle_id = ?")
          .all(row.id) as { technique: string }[]
      ).map((r) => r.technique);

      return { ...row, techniqueNames, _modified: undefined };
    }

    /**
     * 尝试筛选：按层级降级。
     * level: 0=全条件, 1=去exclude, 2=去exclude+去techniques, 3=去exclude+去techniques+去difficulty
     */
    for (let level = 0; level <= 3; level++) {
      const conditions: string[] = [];
      const params: (string | number)[] = [];

      // difficulty
      const useDiff = diff !== null && (level < 3);
      if (useDiff) {
        conditions.push("p.difficulty = ?");
        params.push(diff);
      }

      // techniques AND filter
      const useTechniques = techniqueList.length > 0 && (level < 2);
      if (useTechniques) {
        const ph = techniqueList.map(() => "?").join(",");
        conditions.push(
          `p.id IN (SELECT puzzle_id FROM puzzle_techniques WHERE technique IN (${ph})
           GROUP BY puzzle_id HAVING COUNT(DISTINCT technique) = ?)`
        );
        params.push(...techniqueList, techniqueList.length);
      }

      // exclude
      const useExclude = excludeIds.length > 0 && (level < 1);
      if (useExclude) {
        const ph = excludeIds.map(() => "?").join(",");
        conditions.push(`p.id NOT IN (${ph})`);
        params.push(...excludeIds);
      }

      const where = conditions.length > 0
        ? "WHERE " + conditions.join(" AND ")
        : "";

      const row = db
        .prepare(
          `SELECT p.* FROM puzzles p ${where} ORDER BY RANDOM() LIMIT 1`
        )
        .get(...params) as Record<string, unknown> | undefined;

      if (row) {
        return NextResponse.json({ success: true, data: attachMeta(row) });
      }
    }

    // 全库无题
    return NextResponse.json(
      { success: false, error: "暂无匹配题目" },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "随机出题失败" },
      { status: 500 }
    );
  }
}
