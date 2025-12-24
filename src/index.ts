import { all, closeDb, openDb, run } from './db';

export function add(a: number, b: number): number {
  return a + b;
}

async function main(): Promise<void> {
  const db = openDb();

  try {
    await run(
      db,
      'create table if not exists messages (id integer primary key, body text not null)',
    );
    await run(db, 'insert into messages (body) values (?)', ['hello sqlite']);

    const rows = await all<{ id: number; body: string }>(db, 'select id, body from messages');
    console.log(rows);
  } finally {
    await closeDb(db);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
