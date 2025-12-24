import { createApp } from './app';
import { SqliteDatabase } from './db/sqlite';

const port = Number(process.env.PORT ?? 3000);
const db = new SqliteDatabase();

async function start(): Promise<void> {
  await db.init();
  const app = createApp(db);

  const server = app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    server.close(() => {
      db.close().finally(() => {
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error(err);
  db.close().finally(() => {
    process.exit(1);
  });
});
