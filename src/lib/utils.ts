import { getDb } from './db';

export function verifyEditMode(request: Request): boolean {
  const password = request.headers.get('X-Edit-Password');
  if (!password) return false;
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('edit_password') as { value: string } | undefined;
  return row?.value === password;
}

export function generateId(): string {
  // Simple UUID v4 generator (no external dep needed)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
