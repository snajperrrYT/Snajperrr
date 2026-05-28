// MOCKED better-sqlite3 — in-memory, data lost on container sleep
const store = new Map<string, any[]>();

class MockStatement {
  constructor(private query: string) {}
  run(...params: any[]) { return { changes: 0, lastInsertRowid: 0 }; }
  get(...params: any[]) { return null; }
  all(...params: any[]) { return []; }
}

const db = {
  pragma: (s: string) => {},
  exec: (s: string) => {},
  prepare: (s: string) => new MockStatement(s),
  transaction: (fn: any) => fn,
};

export default db;
