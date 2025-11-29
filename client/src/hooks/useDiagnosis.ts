import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

/**
 * must watch symptomAnalysisSchema in @shared/schema
 */
export interface DiagnosisInput {
  patientId?: string | null;

  symptoms: string[];  // list of symptom names or phrases

  vitalSigns?: {
    temperatureC?: number;
    heartRate?: number;
    systolicBP?: number;
    diastolicBP?: number;
    spo2?: number;
    bloodSugar?: number;
  };

  patientAge: number;
  patientGender: "male" | "female" | "other";
  patientWeight?: number | null;

  language: string; // "en" | "hi" | "ta" | etc.
}

export interface DiagnosisResponse {
  message?: string;
  receivedPayload?: DiagnosisInput;
  [key: string]: any;
}

/**
 * POST /api/diagnose
 */
export function useDiagnosis() {
  return useMutation<DiagnosisResponse, Error, DiagnosisInput>({
    mutationFn: async (payload: DiagnosisInput) => {
      console.log("[useDiagnosis] Sending diagnosis payload:", payload);

      const response = await apiRequest("POST", "/api/diagnose", payload);

      console.log("[useDiagnosis] Received diagnosis response:", response);

      return response;
    },
  });
}
