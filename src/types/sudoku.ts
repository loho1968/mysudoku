export interface Puzzle {
  id: string;
  puzzle: string;
  solution: string | null;
  difficulty: number;
  /** 涉及技巧名称列表（来自 puzzle_techniques 关联表） */
  techniqueNames?: string[];
  /** 题号（数据库自增，按 created_at 升序分配） */
  seq?: number | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameRecord {
  id: string;
  puzzle_id: string;
  time_seconds: number | null;
  completed: boolean;
  hint_used: number;
  check_errors: number;
  started_at: string;
  finished_at: string | null;
}
