import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyEditMode, generateId } from '@/lib/utils';
import { parsePuzzleText } from '@/lib/sudoku/parser';

export async function POST(request: NextRequest) {
  if (!verifyEditMode(request)) {
    return NextResponse.json({ success: false, error: '需要编辑模式' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { text, difficulty = 0 } = body;

    if (!text) {
      return NextResponse.json({ success: false, error: '缺少题目文本' }, { status: 400 });
    }

    const puzzles = parsePuzzleText(text);
    if (puzzles.length === 0) {
      return NextResponse.json({ success: false, error: '未能识别出有效题目' }, { status: 400 });
    }

    const db = getDb();
    const ids: string[] = [];
    const insertPuzzle = db.prepare(
      'INSERT INTO puzzles (id, puzzle, difficulty) VALUES (?, ?, ?)'
    );

    for (const puzzle of puzzles) {
      const id = generateId();
      insertPuzzle.run(id, puzzle, difficulty);
      ids.push(id);
    }

    return NextResponse.json({ success: true, data: { count: ids.length, ids } });
  } catch (error) {
    return NextResponse.json({ success: false, error: '导入失败' }, { status: 500 });
  }
}
