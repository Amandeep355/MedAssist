import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { History, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/contexts/LanguageContext";
import { offlineCache } from "@/lib/offline";
import type { Diagnosis, Patient } from "@shared/schema";
import { format } from "date-fns";

function parseCreatedAt(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as any);
  if (isNaN(d.getTime())) return null;
  return d;
}

export default function HistoryPage() {
  const { t } = useTranslation();

  const { data: diagnoses = [], isLoading } = useQuery<Diagnosis[]>({
    queryKey: ["/api/diagnoses"],
    initialData: () => {
      const cached = offlineCache.getDiagnoses();
      return cached || undefined;
    },
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    initialData: () => {
      const cached = offlineCache.getPatients();
      return cached || undefined;
    },
  });

  useEffect(() => {
    if (diagnoses && diagnoses.length > 0) {
      offlineCache.saveDiagnoses(diagnoses);
    }
  }, [diagnoses]);

  useEffect(() => {
    if (patients && patients.length > 0) {
      offlineCache.savePatients(patients);
    }
  }, [patients]);

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient?.name || "Unknown Patient";
  };

  const sortedDiagnoses = [...diagnoses].sort((a, b) => {
    const da = parseCreatedAt(a.createdAt);
    const db = parseCreatedAt(b.createdAt);

    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;

    return db.getTime() - da.getTime(); // newest first
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">
          {t.history}
        </h1>
        <p className="text-muted-foreground mt-1">
          View past diagnosis records
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Diagnosis History
          </CardTitle>
          <CardDescription>All past diagnoses and treatments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              {t.loading}
            </div>
          ) : sortedDiagnoses.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-testid="text-no-history"
            >
              {t.noDiagnoses}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDiagnoses.map((diagnosis) => (
                <Card
                  key={diagnosis.id}
                  data-testid={`card-diagnosis-${diagnosis.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle
                          className="text-lg"
                          data-testid={`text-patient-name-${diagnosis.id}`}
                        >
                          {getPatientName(diagnosis.patientId)}
                        </CardTitle>
                        <CardDescription>
                          {(() => {
                            const d = parseCreatedAt(diagnosis.createdAt);
                            if (!d) {
                              return "Date not available";
                            }
                            return format(d, "PPpp");
                          })()}
                        </CardDescription>
                      </div>
                      {diagnosis.requiresReferral && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {t.referralRequired}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Symptoms */}
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        {t.symptoms}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(diagnosis.symptoms ?? []).map((symptom, idx) => (
                          <Badge
                            key={`${diagnosis.id}-symptom-${idx}-${symptom}`}
                            variant="outline"
                          >
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Vital signs */}
                    {diagnosis.vitalSigns &&
                      Object.keys(diagnosis.vitalSigns).length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">
                            {t.vitalSigns}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                            {diagnosis.vitalSigns.temperature && (
                              <div className="flex flex-col">
                                <span className="text-muted-foreground">
                                  {t.temperature}
                                </span>
                                <span className="font-medium">
                                  {diagnosis.vitalSigns.temperature}°F
                                </span>
                              </div>
                            )}
                            {diagnosis.vitalSigns.bloodPressure && (
                              <div className="flex flex-col">
                                <span className="text-muted-foreground">
                                  {t.bloodPressure}
                                </span>
                                <span className="font-medium">
                                  {diagnosis.vitalSigns.bloodPressure}
                                </span>
                              </div>
                            )}
                            {diagnosis.vitalSigns.heartRate && (
                              <div className="flex flex-col">
                                <span className="text-muted-foreground">
                                  {t.heartRate}
                                </span>
                                <span className="font-medium">
                                  {diagnosis.vitalSigns.heartRate} bpm
                                </span>
                              </div>
                            )}
                            {diagnosis.vitalSigns.respiratoryRate && (
                              <div className="flex flex-col">
                                <span className="text-muted-foreground">
                                  {t.respiratoryRate}
                                </span>
                                <span className="font-medium">
                                  {diagnosis.vitalSigns.respiratoryRate}
                                </span>
                              </div>
                            )}
                            {diagnosis.vitalSigns.oxygenSaturation && (
                              <div className="flex flex-col">
                                <span className="text-muted-foreground">
                                  {t.oxygenSaturation}
                                </span>
                                <span className="font-medium">
                                  {diagnosis.vitalSigns.oxygenSaturation}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Primary diagnosis */}
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        {t.primaryDiagnosis}
                      </h4>
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-3">
                          <p
                            className="font-medium"
                            data-testid={`text-diagnosis-${diagnosis.id}`}
                          >
                            {diagnosis.primaryDiagnosis}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Differential diagnoses + treatment */}
                    {diagnosis.differentialDiagnoses &&
                      diagnosis.differentialDiagnoses.length > 0 && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value={`details-${diagnosis.id}`}>
                            <AccordionTrigger>
                              {t.differentialDiagnoses} &amp; {t.treatment}
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <div className="space-y-2">
                                {diagnosis.differentialDiagnoses.map(
                                  (diff, idx) => (
                                    <div
                                      key={`${diagnosis.id}-diff-${idx}-${diff.condition}`}
                                      className="flex items-center justify-between p-2 bg-muted rounded"
                                    >
                                      <span className="text-sm">
                                        {diff.condition}
                                      </span>
                                      <Badge variant="outline">
                                        {diff.confidence}%
                                      </Badge>
                                    </div>
                                  ),
                                )}
                              </div>

                              {diagnosis.treatmentProtocol?.medications &&
                                diagnosis.treatmentProtocol.medications
                                  .length > 0 && (
                                  <div>
                                    <h5 className="font-medium text-sm mb-2">
                                      {t.medications}
                                    </h5>
                                    <div className="space-y-2">
                                      {diagnosis.treatmentProtocol.medications.map(
                                        (med, idx) => (
                                          <div
                                            key={`${diagnosis.id}-med-${idx}-${med.name}`}
                                            className="text-sm p-2 bg-muted rounded"
                                          >
                                            <p className="font-medium">
                                              {med.name}
                                            </p>
                                            <p className="text-muted-foreground">
                                              {med.dosage} - {med.frequency} -{" "}
                                              {med.duration}
                                            </p>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
