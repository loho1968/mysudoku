export interface Puzzle {
  id: string;
  puzzle: string;
  solution: string | null;
  difficulty: number;
  source: string | null;
  remark: string | null;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
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
