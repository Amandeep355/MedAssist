import type { Patient, Diagnosis } from "@shared/schema";

const CACHE_KEYS = {
  PATIENTS: "medassist-cache-patients",
  DIAGNOSES: "medassist-cache-diagnoses",
  LAST_SYNC: "medassist-last-sync",
};

export const offlineCache = {
  // Patients
  savePatients(patients: Patient[]) {
    try {
      localStorage.setItem(CACHE_KEYS.PATIENTS, JSON.stringify(patients));
      localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error("Failed to cache patients:", error);
    }
  },

  getPatients(): Patient[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.PATIENTS);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Failed to retrieve cached patients:", error);
      return null;
    }
  },

  // Diagnoses
  saveDiagnoses(diagnoses: Diagnosis[]) {
    try {
      localStorage.setItem(CACHE_KEYS.DIAGNOSES, JSON.stringify(diagnoses));
      localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error("Failed to cache diagnoses:", error);
    }
  },

  getDiagnoses(): Diagnosis[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.DIAGNOSES);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Failed to retrieve cached diagnoses:", error);
      return null;
    }
  },

  // Last sync time
  getLastSync(): Date | null {
    try {
      const lastSync = localStorage.getItem(CACHE_KEYS.LAST_SYNC);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error("Failed to retrieve last sync time:", error);
      return null;
    }
  },

  // Clear all cache
  clearAll() {
    try {
      Object.values(CACHE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  },
};

/* ---------------------- OFFLINE DIAGNOSIS ENGINE ---------------------- */

// Uses browser’s idea of connectivity (internet). Localhost 8000/8001

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

// This matches the payload shape sent from DiagnosisPage
// and the DiagnosisRequest model in ml/app.py.
export type OfflineDiagnosisInput = {
  patientId?: string;
  symptoms: string[];
  vitalSigns?: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  patientAge: number;
  patientGender: string;
  patientWeight?: number | null;
  language: string; // "en" | "hi" | "ta" | "te" | "bn"
};

// Call the local FastAPI service (ml/app.py -> /analyze).
// Adjust the URL/port if your uvicorn runs on a different one.
export async function diagnoseOffline(
  input: OfflineDiagnosisInput
): Promise<any> {
  try {
    const res = await fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw new Error(`Offline NLP API returned status ${res.status}`);
    }

    const data = await res.json();

    // Tag response so UI can show correct toast
    if (!("mode" in data)) {
      (data as any).mode = "offline";
    }

    return data;
  } catch (error) {
    console.error("Offline diagnosis call failed:", error);

    // Safe minimal fallback so the UI doesn't break completely
    return {
      mode: "offline",
      patientId: input.patientId ?? "",
      primaryDiagnosis: "Offline diagnosis service unavailable",
      differentialDiagnoses: [],
      treatmentProtocol: null,
      requiresReferral: false,
      referralReason: "Error in local NLP service",
      knowledgeSnippets: [],
    };
  }
}
