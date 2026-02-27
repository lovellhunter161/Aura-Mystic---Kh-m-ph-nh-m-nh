import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('mystic.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    name TEXT,
    dob TEXT,
    result_summary TEXT,
    interpretation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function saveHistory(data: {
  type: string;
  name: string;
  dob: string;
  result_summary: string;
  interpretation: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO history (type, name, dob, result_summary, interpretation)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(data.type, data.name, data.dob, data.result_summary, data.interpretation);
}

export function getHistory(limit = 10) {
  const stmt = db.prepare('SELECT * FROM history ORDER BY created_at DESC LIMIT ?');
  return stmt.all(limit);
}

export function deleteHistory(id: number) {
  const stmt = db.prepare('DELETE FROM history WHERE id = ?');
  return stmt.run(id);
}
