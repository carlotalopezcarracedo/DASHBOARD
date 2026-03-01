import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.resolve(process.cwd(), "data.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
