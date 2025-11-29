import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Plus, X, Activity, FileText } from "lucide-react";
import { offlineCache, diagnoseOffline, isOnline } from "@/lib/offline";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/contexts/LanguageContext";
import { commonSymptoms } from "@/lib/symptoms";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient, Diagnosis } from "@shared/schema";

type KnowledgeSnippet = {
  id: string;
  title: string;
  content: string;
  source?: string;
};

type DiagnosisWithKnowledge = Diagnosis & {
  knowledgeSnippets?: KnowledgeSnippet[];
};

export default function DiagnosisPage() {
  const { language, t } = useTranslation();
  const { toast } = useToast();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSearch, setSymptomSearch] = useState("");
  const [vitalSigns, setVitalSigns] = useState({
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: "",
  });
  const [diagnosisResult, setDiagnosisResult] =
    useState<DiagnosisWithKnowledge | null>(null);
  const [viewMode, setViewMode] = useState<"medical" | "simple">("medical");

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    initialData: () => {
      const cached = offlineCache.getPatients();
      return cached || undefined;
    },
  });

  useEffect(() => {
    if (patients && patients.length > 0) {
      offlineCache.savePatients(patients);
    }
  }, [patients]);

  const analyzeMutation = useMutation({
    mutationFn: async (data: any) => {
      // If browser is offline, skip backend and use offline engine
      if (!isOnline()) {
        const offlineResult = await diagnoseOffline(data);
        return offlineResult;
      }

      // Try online API first
      try {
        const result = await apiRequest("POST", "/api/diagnose", data);
        return result;
      } catch (error) {
        // If online diagnosis fails (500, network error, etc.), fall back to offline
        const offlineResult = await diagnoseOffline(data);
        return offlineResult;
      }
    },
    onSuccess: (data: any) => {
      const casted = data as DiagnosisWithKnowledge;
      setDiagnosisResult(casted);

      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/diagnoses"] });

      const cachedDiagnoses = offlineCache.getDiagnoses() || [];
      offlineCache.saveDiagnoses([...cachedDiagnoses, casted]);

      toast({
        title: t.success,
        description:
          data && data.mode === "offline"
            ? "Diagnosis completed in offline mode"
            : "Diagnosis completed successfully",
      });
    },
    onError: () => {
      toast({
        title: t.error,
        description: "Failed to analyze symptoms",
        variant: "destructive",
      });
    },
  });

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAnalyze = () => {
    if (!selectedPatient || selectedSymptoms.length === 0) {
      toast({
        title: t.error,
        description: "Please select a patient and at least one symptom",
        variant: "destructive",
      });
      return;
    }

    const vitalSignsData: any = {};
    if (vitalSigns.temperature)
      vitalSignsData.temperature = parseFloat(vitalSigns.temperature);
    if (vitalSigns.bloodPressure)
      vitalSignsData.bloodPressure = vitalSigns.bloodPressure;
    if (vitalSigns.heartRate)
      vitalSignsData.heartRate = parseInt(vitalSigns.heartRate);
    if (vitalSigns.respiratoryRate)
      vitalSignsData.respiratoryRate = parseInt(vitalSigns.respiratoryRate);
    if (vitalSigns.oxygenSaturation)
      vitalSignsData.oxygenSaturation = parseFloat(
        vitalSigns.oxygenSaturation
      );

    analyzeMutation.mutate({
      patientId: selectedPatient.id,
      symptoms: selectedSymptoms,
      vitalSigns:
        Object.keys(vitalSignsData).length > 0 ? vitalSignsData : undefined,
      patientAge: selectedPatient.age,
      patientGender: selectedPatient.gender,
      patientWeight: selectedPatient.weight,
      language,
    });
  };

  const filteredSymptoms = (commonSymptoms[language] || commonSymptoms.en).filter(
    (symptom) =>
      symptom.toLowerCase().includes(symptomSearch.toLowerCase())
  );

  const hasSymptomsForAnalyze = selectedSymptoms.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-semibold"
            data-testid="text-page-title"
          >
            {t.newDiagnosis}
          </h1>
          <p className="text-muted-foreground mt-1">{t.selectSymptoms}</p>
        </div>

        {/* Simple hint button instead of navigation */}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast({
              title: t.addPatient,
              description:
                "Use the Patients section to add a new patient record.",
            })
          }
          data-testid="button-add-patient-hint"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t.addPatient}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT SIDE: patient + symptoms + vitals */}
        <div className="space-y-6">
          {/* Patient info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t.patientInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t.name}</Label>
                <Select
                  value={selectedPatient?.id || ""}
                  onValueChange={(id) => {
                    const patient = patients.find((p) => p.id === id);
                    setSelectedPatient(patient || null);
                  }}
                >
                  <SelectTrigger data-testid="select-patient">
                    <SelectValue placeholder={t.searchPatients} />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem
                        key={patient.id}
                        value={patient.id}
                        data-testid={`option-patient-${patient.id}`}
                      >
                        {patient.name} - {patient.age} {t.age},{" "}
                        {patient.gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPatient && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-md">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t.age}
                    </div>
                    <div
                      className="font-medium"
                      data-testid="text-patient-age"
                    >
                      {selectedPatient.age}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t.gender}
                    </div>
                    <div
                      className="font-medium"
                      data-testid="text-patient-gender"
                    >
                      {selectedPatient.gender}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t.weight}
                    </div>
                    <div
                      className="font-medium"
                      data-testid="text-patient-weight"
                    >
                      {selectedPatient.weight || "-"}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Symptoms */}
          <Card>
            <CardHeader>
              <CardTitle>{t.symptoms}</CardTitle>
              <CardDescription>{t.selectSymptoms}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search + chips */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchSymptoms}
                  value={symptomSearch}
                  onChange={(e) => setSymptomSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-symptom-search"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((symptom) => (
                  <Badge
                    key={symptom}
                    variant="default"
                    className="gap-1 cursor-pointer"
                    onClick={() => handleSymptomToggle(symptom)}
                    data-testid={`badge-selected-symptom-${symptom}`}
                  >
                    {symptom}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {filteredSymptoms.map((symptom) => (
                  <Button
                    key={symptom}
                    variant={
                      selectedSymptoms.includes(symptom)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleSymptomToggle(symptom)}
                    className="justify-start"
                    data-testid={`button-symptom-${symptom}`}
                  >
                    {symptom}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vital signs */}
          <Card>
            <CardHeader>
              <CardTitle>{t.vitalSigns}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.temperature}</Label>
                  <Input
                    type="number"
                    placeholder="98.6"
                    value={vitalSigns.temperature}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        temperature: e.target.value,
                      })
                    }
                    data-testid="input-temperature"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.bloodPressure}</Label>
                  <Input
                    placeholder="120/80"
                    value={vitalSigns.bloodPressure}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        bloodPressure: e.target.value,
                      })
                    }
                    data-testid="input-blood-pressure"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.heartRate}</Label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={vitalSigns.heartRate}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        heartRate: e.target.value,
                      })
                    }
                    data-testid="input-heart-rate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.respiratoryRate}</Label>
                  <Input
                    type="number"
                    placeholder="16"
                    value={vitalSigns.respiratoryRate}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        respiratoryRate: e.target.value,
                      })
                    }
                    data-testid="input-respiratory-rate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.oxygenSaturation}</Label>
                  <Input
                    type="number"
                    placeholder="98"
                    value={vitalSigns.oxygenSaturation}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        oxygenSaturation: e.target.value,
                      })
                    }
                    data-testid="input-oxygen-saturation"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleAnalyze}
            disabled={
              !selectedPatient ||
              !hasSymptomsForAnalyze ||
              analyzeMutation.isPending
            }
            className="w-full"
            size="lg"
            data-testid="button-analyze"
          >
            {analyzeMutation.isPending ? t.analyzing : t.analyze}
          </Button>
        </div>

        {/* RIGHT SIDE: diagnosis + treatment + knowledge snippets */}
        <div className="space-y-6">
          {diagnosisResult && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t.diagnosis}
                  </CardTitle>
                  <Tabs
                    value={viewMode}
                    onValueChange={(v) =>
                      setViewMode(v as "medical" | "simple")
                    }
                  >
                    <TabsList>
                      <TabsTrigger
                        value="medical"
                        data-testid="tab-medical-view"
                      >
                        {t.medicalView}
                      </TabsTrigger>
                      <TabsTrigger
                        value="simple"
                        data-testid="tab-simple-view"
                      >
                        {t.simpleView}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {diagnosisResult.requiresReferral && (
                  <Alert variant="destructive">
                    <AlertTitle>{t.referralRequired}</AlertTitle>
                    <AlertDescription data-testid="text-referral-reason">
                      {diagnosisResult.referralReason}
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <h3 className="font-semibold mb-3">
                    {t.primaryDiagnosis}
                  </h3>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <p
                        className="font-medium text-lg"
                        data-testid="text-primary-diagnosis"
                      >
                        {diagnosisResult.primaryDiagnosis}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {diagnosisResult.differentialDiagnoses &&
                  diagnosisResult.differentialDiagnoses.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">
                        {t.differentialDiagnoses}
                      </h3>
                      <div className="space-y-3">
                        {diagnosisResult.differentialDiagnoses.map(
                          (diff, idx) => (
                            <Card key={idx}>
                              <CardContent className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <p
                                    className="font-medium"
                                    data-testid={`text-differential-${idx}`}
                                  >
                                    {diff.condition}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    data-testid={`badge-confidence-${idx}`}
                                  >
                                    {diff.confidence}% {t.confidence}
                                  </Badge>
                                </div>
                                <Progress
                                  value={diff.confidence}
                                  className="h-2"
                                />
                                {viewMode === "medical" && diff.reasoning && (
                                  <p className="text-sm text-muted-foreground">
                                    {diff.reasoning}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {diagnosisResult.treatmentProtocol && (
                  <div>
                    <h3 className="font-semibold mb-3">{t.treatment}</h3>
                    <Accordion type="single" collapsible>
                      {diagnosisResult.treatmentProtocol.medications &&
                        diagnosisResult.treatmentProtocol.medications
                          .length > 0 && (
                          <AccordionItem value="medications">
                            <AccordionTrigger data-testid="accordion-medications">
                              {t.medications}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                {diagnosisResult.treatmentProtocol.medications.map(
                                  (med, idx) => (
                                    <Card key={idx}>
                                      <CardContent className="p-3">
                                        <p
                                          className="font-medium"
                                          data-testid={`text-medication-${idx}`}
                                        >
                                          {med.name}
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-muted-foreground">
                                          <div>
                                            <span className="font-medium">
                                              {t.dosage}:
                                            </span>{" "}
                                            {med.dosage}
                                          </div>
                                          <div>
                                            <span className="font-medium">
                                              {t.frequency}:
                                            </span>{" "}
                                            {med.frequency}
                                          </div>
                                          <div>
                                            <span className="font-medium">
                                              {t.duration}:
                                            </span>{" "}
                                            {med.duration}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                      {diagnosisResult.treatmentProtocol.procedures &&
                        diagnosisResult.treatmentProtocol.procedures
                          .length > 0 && (
                          <AccordionItem value="procedures">
                            <AccordionTrigger data-testid="accordion-procedures">
                              {t.procedures}
                            </AccordionTrigger>
                            <AccordionContent>
                              <ul className="list-disc list-inside space-y-1">
                                {diagnosisResult.treatmentProtocol.procedures.map(
                                  (proc, idx) => (
                                    <li
                                      key={idx}
                                      className="text-sm"
                                    >
                                      {proc}
                                    </li>
                                  )
                                )}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                      {diagnosisResult.treatmentProtocol.lifestyle &&
                        diagnosisResult.treatmentProtocol.lifestyle
                          .length > 0 && (
                          <AccordionItem value="lifestyle">
                            <AccordionTrigger data-testid="accordion-lifestyle">
                              {t.lifestyle}
                            </AccordionTrigger>
                            <AccordionContent>
                              <ul className="list-disc list-inside space-y-1">
                                {diagnosisResult.treatmentProtocol.lifestyle.map(
                                  (item, idx) => (
                                    <li
                                      key={idx}
                                      className="text-sm"
                                    >
                                      {item}
                                    </li>
                                  )
                                )}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                    </Accordion>
                  </div>
                )}

                {diagnosisResult.knowledgeSnippets &&
                  diagnosisResult.knowledgeSnippets.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">
                        Knowledge snippets
                      </h3>
                      <div className="space-y-3">
                        {diagnosisResult.knowledgeSnippets.map((snip) => (
                          <Card key={snip.id}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  {snip.title}
                                </CardTitle>
                                {snip.source && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {snip.source}
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {snip.content}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {!diagnosisResult && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t.selectSymptoms}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
