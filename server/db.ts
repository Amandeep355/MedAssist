// server/db.ts
import Database from "better-sqlite3";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path of SQLite file
const dbPath = path.join(__dirname, "db", "medassist.sqlite");

// Open (or create) the SQLite database
export const db = new Database(dbPath);

// Some sensible pragmas for local app
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables if they don't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    weight REAL,
    contactNumber TEXT,
    address TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS diagnoses (
    id TEXT PRIMARY KEY,
    patientId TEXT NOT NULL,
    symptoms TEXT NOT NULL,             
    vitalSigns TEXT,                   
    primaryDiagnosis TEXT NOT NULL,
    differentialDiagnoses TEXT,         
    treatmentProtocol TEXT,             
    requiresReferral INTEGER NOT NULL,  
    referralReason TEXT,
    language TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS knowledge_base (
    id TEXT PRIMARY KEY,
    symptoms TEXT NOT NULL,             
    ageGroup TEXT NOT NULL,
    gender TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    confidence REAL NOT NULL,
    outcome TEXT,
    createdAt TEXT NOT NULL
  );
`);

// Helpers to generate IDs and timestamps if i need them later
export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

console.log("[sqlite] Initialized at", dbPath);
