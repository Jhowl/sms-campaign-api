import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";

type Params = readonly unknown[];

export class SqliteDatabase {
  private db: sqlite3.Database;

  constructor(filePath: string = path.join("data", "data.db")) {
    const dir = path.dirname(filePath);

    // Ensure the parent folder exists (ignore "current folder" case)
    if (dir !== "." && dir.length > 0) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new sqlite3.Database(filePath);
  }

  async init(schemaFile = "schema.sql"): Promise<void> {
    const schemaPath = path.join(process.cwd(), schemaFile);
    const sql = fs.readFileSync(schemaPath, "utf8");
    await this.exec(sql);
  }

  run(sql: string, params: Params = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params as unknown[], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  runWithId(sql: string, params: Params = []): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params as unknown[], function (this: sqlite3.RunResult, err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  }

  exec(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  get<T>(sql: string, params: Params = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params as unknown[], (err, row) => {
        if (err) return reject(err);
        resolve(row as T | undefined);
      });
    });
  }

  all<T>(sql: string, params: Params = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params as unknown[], (err, rows) => {
        if (err) return reject(err);
        resolve(rows as T[]);
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}
