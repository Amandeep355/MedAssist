// @ts-nocheck
import {
  type Patient,
  type InsertPatient,
  type Diagnosis,
  type InsertDiagnosis,
  type KnowledgeBase,
} from "@shared/schema";
import { db, newId, nowIso } from "./db";

export interface IStorage {
  // Patient operations
  getPatient(id: string): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;

  // Diagnosis operations
  getDiagnosis(id: string): Promise<Diagnosis | undefined>;
  getDiagnosesByPatient(patientId: string): Promise<Diagnosis[]>;
  getAllDiagnoses(): Promise<Diagnosis[]>;
  createDiagnosis(diagnosis: InsertDiagnosis): Promise<Diagnosis>;

  // Knowledge base operations
  addKnowledgeEntry(
    entry: Omit<KnowledgeBase, "id" | "createdAt">
  ): Promise<KnowledgeBase>;
  searchKnowledge(
    symptoms: string[],
    ageGroup: string,
    gender: string
  ): Promise<KnowledgeBase[]>;
}

// ---------- helpers to convert DB rows <-> TS types ----------

function rowToPatient(row: any): Patient {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    gender: row.gender,
    weight: row.weight ?? null,
    contactNumber: row.contactNumber ?? null,
    address: row.address ?? null,
    createdAt: new Date(row.createdAt),
  };
}

function rowToDiagnosis(row: any): Diagnosis {
  const vitalSigns = row.vitalSigns
    ? (JSON.parse(row.vitalSigns) as Diagnosis["vitalSigns"])
    : null;

  const differentialDiagnoses = row.differentialDiagnoses
    ? (JSON.parse(
        row.differentialDiagnoses
      ) as Diagnosis["differentialDiagnoses"])
    : [];

  const treatmentProtocol = row.treatmentProtocol
    ? (JSON.parse(row.treatmentProtocol) as Diagnosis["treatmentProtocol"])
    : null;

  const symptoms = row.symptoms
    ? (JSON.parse(row.symptoms) as string[])
    : [];

  return {
    id: row.id,
    patientId: row.patientId,
    symptoms,
    vitalSigns,
    primaryDiagnosis: row.primaryDiagnosis,
    differentialDiagnoses,
    treatmentProtocol,
    requiresReferral: !!row.requiresReferral,
    referralReason: row.referralReason ?? null,
    language: row.language ?? "en",
    createdAt: new Date(row.createdAt),
  };
}

function rowToKnowledge(row: any): KnowledgeBase {
  const symptoms = row.symptoms
    ? (JSON.parse(row.symptoms) as string[])
    : [];

  return {
    id: row.id,
    symptoms,
    ageGroup: row.ageGroup,
    gender: row.gender,
    diagnosis: row.diagnosis,
    confidence: row.confidence,
    outcome: row.outcome ?? null,
    createdAt: new Date(row.createdAt),
  };
}

// ---------- SQLite-backed storage implementation ----------

export class SqliteStorage implements IStorage {
  // Patients
  async getPatient(id: string): Promise<Patient | undefined> {
    const row = db
      .prepare("SELECT * FROM patients WHERE id = ?")
      .get(id) as any | undefined;
    return row ? rowToPatient(row) : undefined;
  }

  async getAllPatients(): Promise<Patient[]> {
    const rows = db
      .prepare("SELECT * FROM patients ORDER BY datetime(createdAt) DESC")
      .all() as any[];
    return rows.map(rowToPatient);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = newId();
    const createdAtIso = nowIso();

    db.prepare(
      `
      INSERT INTO patients (
        id, name, age, gender, weight, contactNumber, address, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      insertPatient.name,
      insertPatient.age,
      insertPatient.gender,
      insertPatient.weight ?? null,
      (insertPatient as any).contactNumber ?? null,
      (insertPatient as any).address ?? null,
      createdAtIso
    );

    return {
      id,
      name: insertPatient.name,
      age: insertPatient.age,
      gender: insertPatient.gender,
      weight: insertPatient.weight ?? null,
      contactNumber: (insertPatient as any).contactNumber ?? null,
      address: (insertPatient as any).address ?? null,
      createdAt: new Date(createdAtIso),
    };
  }

  // Diagnoses
  async getDiagnosis(id: string): Promise<Diagnosis | undefined> {
    const row = db
      .prepare("SELECT * FROM diagnoses WHERE id = ?")
      .get(id) as any | undefined;
    return row ? rowToDiagnosis(row) : undefined;
  }

  async getDiagnosesByPatient(patientId: string): Promise<Diagnosis[]> {
    const rows = db
      .prepare(
        "SELECT * FROM diagnoses WHERE patientId = ? ORDER BY datetime(createdAt) DESC"
      )
      .all(patientId) as any[];
    return rows.map(rowToDiagnosis);
  }

  async getAllDiagnoses(): Promise<Diagnosis[]> {
    const rows = db
      .prepare("SELECT * FROM diagnoses ORDER BY datetime(createdAt) DESC")
      .all() as any[];
    return rows.map(rowToDiagnosis);
  }

  async createDiagnosis(
    insertDiagnosis: InsertDiagnosis
  ): Promise<Diagnosis> {
    const id = newId();
    const createdAtIso = nowIso();

    db.prepare(
      `
      INSERT INTO diagnoses (
        id,
        patientId,
        symptoms,
        vitalSigns,
        primaryDiagnosis,
        differentialDiagnoses,
        treatmentProtocol,
        requiresReferral,
        referralReason,
        language,
        createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      insertDiagnosis.patientId,
      JSON.stringify(insertDiagnosis.symptoms ?? []),
      insertDiagnosis.vitalSigns
        ? JSON.stringify(insertDiagnosis.vitalSigns)
        : null,
      insertDiagnosis.primaryDiagnosis,
      insertDiagnosis.differentialDiagnoses
        ? JSON.stringify(insertDiagnosis.differentialDiagnoses)
        : null,
      insertDiagnosis.treatmentProtocol
        ? JSON.stringify(insertDiagnosis.treatmentProtocol)
        : null,
      insertDiagnosis.requiresReferral ? 1 : 0,
      insertDiagnosis.referralReason ?? null,
      insertDiagnosis.language ?? "en",
      createdAtIso
    );

    return {
      id,
      patientId: insertDiagnosis.patientId,
      symptoms: insertDiagnosis.symptoms ?? [],
      vitalSigns: insertDiagnosis.vitalSigns ?? null,
      primaryDiagnosis: insertDiagnosis.primaryDiagnosis,
      differentialDiagnoses: insertDiagnosis.differentialDiagnoses ?? [],
      treatmentProtocol: insertDiagnosis.treatmentProtocol ?? null,
      requiresReferral: !!insertDiagnosis.requiresReferral,
      referralReason: insertDiagnosis.referralReason ?? null,
      language: insertDiagnosis.language ?? "en",
      createdAt: new Date(createdAtIso),
    };
  }

  // Knowledge base
  async addKnowledgeEntry(
    entry: Omit<KnowledgeBase, "id" | "createdAt">
  ): Promise<KnowledgeBase> {
    const id = newId();
    const createdAtIso = nowIso();

    db.prepare(
      `
      INSERT INTO knowledge_base (
        id, symptoms, ageGroup, gender, diagnosis, confidence, outcome, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      JSON.stringify(entry.symptoms ?? []),
      entry.ageGroup,
      entry.gender,
      entry.diagnosis,
      entry.confidence,
      entry.outcome ?? null,
      createdAtIso
    );

    return {
      id,
      symptoms: entry.symptoms ?? [],
      ageGroup: entry.ageGroup,
      gender: entry.gender,
      diagnosis: entry.diagnosis,
      confidence: entry.confidence,
      outcome: entry.outcome ?? null,
      createdAt: new Date(createdAtIso),
    };
  }

  async searchKnowledge(
    symptoms: string[],
    ageGroup: string,
    gender: string
  ): Promise<KnowledgeBase[]> {
    const rows = db
      .prepare(
        `
        SELECT * FROM knowledge_base
        WHERE ageGroup = ?
          AND (gender = ? OR gender = 'other')
      `
      )
      .all(ageGroup, gender) as any[];

    const filtered = rows.filter((row) => {
      const rowSymptoms: string[] = row.symptoms
        ? JSON.parse(row.symptoms)
        : [];
      return symptoms.some((s) => rowSymptoms.includes(s));
    });

    return filtered
      .map(rowToKnowledge)
      .sort((a, b) => b.confidence - a.confidence);
  }
}

// Single shared instance
export const storage: IStorage = new SqliteStorage();
