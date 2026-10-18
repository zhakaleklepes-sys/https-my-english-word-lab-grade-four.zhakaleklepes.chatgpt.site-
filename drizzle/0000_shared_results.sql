CREATE TABLE IF NOT EXISTS test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student TEXT NOT NULL,
  student_key TEXT NOT NULL,
  unit INTEGER NOT NULL CHECK (unit BETWEEN 0 AND 7),
  score INTEGER NOT NULL CHECK (score >= 0),
  total INTEGER NOT NULL CHECK (total > 0),
  percent INTEGER NOT NULL CHECK (percent BETWEEN 0 AND 100),
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_test_results_student_unit_date
ON test_results (student_key, unit, created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_test_results_created_at
ON test_results (created_at);
