import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const sqlite = sqlite3.verbose();

export type Db = sqlite3.Database;

export function openDb(filePath = path.join('data', 'data.db')): Db {
  const dir = path.dirname(filePath);
  if (dir && dir !== '.') {
    fs.mkdirSync(dir, { recursive: true });
  }
  return new sqlite.Database(filePath);
}

export function closeDb(db: Db): Promise<void> {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export function run(db: Db, sql: string, params: Array<unknown> = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export function get<T>(
  db: Db,
  sql: string,
  params: Array<unknown> = [],
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row as T | undefined);
    });
  });
}

export function all<T>(
  db: Db,
  sql: string,
  params: Array<unknown> = [],
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows as T[]);
    });
  });
}
