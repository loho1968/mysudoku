import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const db = getDb();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('edit_password') as { value: string } | undefined;

    if (row && row.value === password) {
      return NextResponse.json({ success: true, message: '已验证' });
    }
    return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: '验证失败' }, { status: 500 });
  }
}
