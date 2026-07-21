import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyEditMode, generateId } from "@/lib/utils";
import {
  generatePuzzles,
  type Difficulty,
} from "@/lib/sudoku/generator";

/**
 * @file puzzles/generate/route.ts
 * @author loho
 *
 * 数独题目生成器 API：POST /api/puzzles/generate
 *
 * 请求体：
 * - difficulty?: 1 | 2 | 3  简单 / 中等 / 困难
 * - technique?: string      目标技巧名（与 difficulty 二选一）
 * - count?: number          生成数量（默认 5，最大 20）
 *
 * 权限：需要编辑模式（verifyEditMode）
 *
 * 返回：{ success, data: { generated, ids } }
 */

interface GenerateBody {
  difficulty?: Difficulty;
  technique?: string;
  count?: number;
}

export async function POST(request: NextRequest) {
  if (!verifyEditMode(request)) {
    return NextResponse.json(
      { success: false, error: "需要编辑模式" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as GenerateBody;
    const { difficulty, technique, count = 5 } = body;

    // 校验参数：difficulty 或 technique 至少一个
    if (!difficulty && !technique) {
      return NextResponse.json(
        { success: false, error: "需要指定 difficulty 或 technique" },
        { status: 400 }
      );
    }
    if (difficulty && (![1, 2, 3].includes(difficulty))) {
      return NextResponse.json(
        { success: false, error: "difficulty 取值 1/2/3" },
        { status: 400 }
      );
    }

    // count 上限保护（生成耗时，避免一次太多）
    const safeCount = Math.max(1, Math.min(20, Math.floor(count)));

    // 生成题目
    const puzzles = generatePuzzles(
      { difficulty: difficulty as Difficulty | undefined, technique },
      safeCount
    );

    if (puzzles.length === 0) {
      return NextResponse.json(
        { success: false, error: "未能生成符合条件的题目，请重试" },
        { status: 500 }
      );
    }

    // 写入数据库
    const db = getDb();
    const maxRow = db.prepare(
      "SELECT COALESCE(MAX(seq), 0) AS maxSeq FROM puzzles"
    ).get() as { maxSeq: number };
    let nextSeq = maxRow.maxSeq;

    const insertPuzzle = db.prepare(
      "INSERT INTO puzzles (id, puzzle, solution, difficulty, seq) VALUES (?, ?, ?, ?, ?)"
    );
    const insertTech = db.prepare(
      "INSERT OR IGNORE INTO puzzle_techniques (puzzle_id, technique) VALUES (?, ?)"
    );

    const ids: string[] = [];
    const runTx = db.transaction(() => {
      for (const p of puzzles) {
        const id = generateId();
        nextSeq++;
        insertPuzzle.run(id, p.puzzle, p.solution, p.difficulty, nextSeq);
        for (const tech of p.techniqueNames) {
          insertTech.run(id, tech);
        }
        ids.push(id);
      }
    });
    runTx();

    return NextResponse.json({
      success: true,
      data: { generated: puzzles.length, ids },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "生成题目失败" },
      { status: 500 }
    );
  }
}
