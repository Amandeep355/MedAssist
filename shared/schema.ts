import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  weight: integer("weight"),
  contactNumber: text("contact_number"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const diagnoses = pgTable("diagnoses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  symptoms: jsonb("symptoms").notNull().$type<string[]>(),
  vitalSigns: jsonb("vital_signs").$type<{
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  }>(),
  primaryDiagnosis: text("primary_diagnosis").notNull(),
  differentialDiagnoses: jsonb("differential_diagnoses").notNull().$type<Array<{
    condition: string;
    confidence: number;
    reasoning: string;
  }>>(),
  treatmentProtocol: jsonb("treatment_protocol").$type<{
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    procedures: string[];
    lifestyle: string[];
  }>(),
  requiresReferral: boolean("requires_referral").default(false).notNull(),
  referralReason: text("referral_reason"),
  language: text("language").default("en").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeBase = pgTable("knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symptoms: jsonb("symptoms").notNull().$type<string[]>(),
  ageGroup: text("age_group").notNull(),
  gender: text("gender").notNull(),
  diagnosis: text("diagnosis").notNull(),
  confidence: integer("confidence").notNull(),
  outcome: text("outcome"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(0).max(150),
  gender: z.enum(["male", "female", "other"]),
  weight: z.number().min(1).max(300).optional(),
});

export const insertDiagnosisSchema = createInsertSchema(diagnoses).omit({
  id: true,
  createdAt: true,
}).extend({
  patientId: z.string(),
  symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  language: z.enum(["en", "hi", "ta", "te", "bn"]).default("en"),
});

export const symptomAnalysisSchema = z.object({
  patientId: z.string(),
  symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  vitalSigns: z.object({
    temperature: z.number().optional(),
    bloodPressure: z.string().optional(),
    heartRate: z.number().optional(),
    respiratoryRate: z.number().optional(),
    oxygenSaturation: z.number().optional(),
  }).optional(),
  patientAge: z.number(),
  patientGender: z.string(),
  patientWeight: z.number().optional(),
  language: z.enum(["en", "hi", "ta", "te", "bn"]).default("en"),
});

export const drugInteractionSchema = z.object({
  medications: z.array(z.string()).min(1),
  patientAge: z.number(),
  patientWeight: z.number().optional(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Diagnosis = typeof diagnoses.$inferSelect;
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
export type SymptomAnalysis = z.infer<typeof symptomAnalysisSchema>;
export type DrugInteraction = z.infer<typeof drugInteractionSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
