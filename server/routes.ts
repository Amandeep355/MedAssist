import axios from "axios";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, symptomAnalysisSchema, drugInteractionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Patient routes
  app.get("/api/patients", async (_req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid patient data", errors: error.errors });
      }
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  // Diagnosis routes
  app.get("/api/diagnoses", async (_req, res) => {
    try {
      const diagnoses = await storage.getAllDiagnoses();
      res.json(diagnoses);
    } catch (error) {
      console.error("Error fetching diagnoses:", error);
      res.status(500).json({ message: "Failed to fetch diagnoses" });
    }
  });

  app.get("/api/diagnoses/:id", async (req, res) => {
    try {
      const diagnosis = await storage.getDiagnosis(req.params.id);
      if (!diagnosis) {
        return res.status(404).json({ message: "Diagnosis not found" });
      }
      res.json(diagnosis);
    } catch (error) {
      console.error("Error fetching diagnosis:", error);
      res.status(500).json({ message: "Failed to fetch diagnosis" });
    }
  });

  app.get("/api/patients/:id/diagnoses", async (req, res) => {
    try {
      const diagnoses = await storage.getDiagnosesByPatient(req.params.id);
      res.json(diagnoses);
    } catch (error) {
      console.error("Error fetching patient diagnoses:", error);
      res.status(500).json({ message: "Failed to fetch patient diagnoses" });
    }
  });

  // Main Diagnosis API (Express → FastAPI NLP → store diagnosis + KB)
  app.post("/api/diagnose", async (req, res) => {
    try {
      const validatedData = symptomAnalysisSchema.parse(req.body);
      console.log("Diagnosis input received:", validatedData);

      // 1) Call FastAPI NLP service
      const fastApiResponse = await axios.post(
        "http://127.0.0.1:8000/analyze",
        validatedData,
        { timeout: 28000 } // under 30 sec limit
      );

      const aiDiagnosis = fastApiResponse.data;

      // 2) Store diagnosis using our storage layer
      const diagnosis = await storage.createDiagnosis({
        patientId: validatedData.patientId,
        symptoms: validatedData.symptoms,
        vitalSigns: validatedData.vitalSigns ?? null,
        primaryDiagnosis: aiDiagnosis.primaryDiagnosis,
        differentialDiagnoses: aiDiagnosis.differentialDiagnoses,
        treatmentProtocol: aiDiagnosis.treatmentProtocol ?? null,
        requiresReferral: aiDiagnosis.requiresReferral ?? false,
        referralReason: aiDiagnosis.referralReason ?? null,
        language: validatedData.language,
      });

      // 3) Add anonymized knowledge-base entry
      const ageGroup =
        validatedData.patientAge < 18
          ? "child"
          : validatedData.patientAge < 60
          ? "adult"
          : "senior";

      await storage.addKnowledgeEntry({
        symptoms: validatedData.symptoms,
        ageGroup,
        gender: validatedData.patientGender,
        diagnosis: aiDiagnosis.primaryDiagnosis,
        confidence:
          aiDiagnosis.differentialDiagnoses?.[0]?.confidence ?? 100,
        outcome: null,
      });

      // 4) Return stored diagnosis (with id, createdAt etc.) to frontend
      return res.status(201).json(diagnosis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid diagnosis data", errors: error.errors });
      }
      console.error("NLP error:", error);
      return res.status(500).json({ message: "NLP service unavailable" });
    }
  });

  // Drug Interaction API (still placeholder until NLP is added)
  app.post("/api/drug-interactions", async (req, res) => {
    try {
      const validatedData = drugInteractionSchema.parse(req.body);
      console.log("Drug interaction input received:", validatedData);

      return res.status(200).json({
        message: "Drug interaction API hit successfully. NLP not connected yet.",
        receivedPayload: validatedData,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error checking drug interactions:", error);
      res.status(500).json({ message: "Drug interaction check failed" });
    }
  });

  // Knowledge base search endpoint
  app.post("/api/knowledge/search", async (req, res) => {
    try {
      const { symptoms, ageGroup, gender } = req.body;
      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return res.status(400).json({ message: "Symptoms are required" });
      }
      const results = await storage.searchKnowledge(symptoms, ageGroup, gender);
      res.json(results);
    } catch (error) {
      console.error("Error searching knowledge base:", error);
      res.status(500).json({ message: "Failed to search knowledge base" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
