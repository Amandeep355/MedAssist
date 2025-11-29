import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { offlineCache } from "@/lib/offline";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@shared/schema";

export default function PatientsPage() {
  const { language, t } = useTranslation();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "male",
    weight: "",
    contactNumber: "",
    address: "",
  });

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
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

  const addPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/patients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setIsAddDialogOpen(false);
      setNewPatient({
        name: "",
        age: "",
        gender: "male",
        weight: "",
        contactNumber: "",
        address: "",
      });
      toast({
        title: t.success,
        description: "Patient added successfully",
      });
    },
    onError: () => {
      toast({
        title: t.error,
        description: "Failed to add patient",
        variant: "destructive",
      });
    },
  });

  const handleAddPatient = () => {
    if (!newPatient.name || !newPatient.age) {
      toast({
        title: t.error,
        description: "Name and age are required",
        variant: "destructive",
      });
      return;
    }

    addPatientMutation.mutate({
      name: newPatient.name,
      age: parseInt(newPatient.age),
      gender: newPatient.gender,
      weight: newPatient.weight ? parseInt(newPatient.weight) : undefined,
      contactNumber: newPatient.contactNumber || undefined,
      address: newPatient.address || undefined,
    });
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.contactNumber?.includes(searchTerm)
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">{t.patients}</h1>
          <p className="text-muted-foreground mt-1">Manage patient records</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-patient">
              <Plus className="h-4 w-4" />
              {t.addPatient}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addPatient}</DialogTitle>
              <DialogDescription>{t.patientInfo}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.name} *</Label>
                <Input
                  id="name"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  data-testid="input-patient-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">{t.age} *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    data-testid="input-patient-age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">{t.gender}</Label>
                  <Select
                    value={newPatient.gender}
                    onValueChange={(value) => setNewPatient({ ...newPatient, gender: value })}
                  >
                    <SelectTrigger id="gender" data-testid="select-patient-gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t.male}</SelectItem>
                      <SelectItem value="female">{t.female}</SelectItem>
                      <SelectItem value="other">{t.other}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">{t.weight}</Label>
                <Input
                  id="weight"
                  type="number"
                  value={newPatient.weight}
                  onChange={(e) => setNewPatient({ ...newPatient, weight: e.target.value })}
                  data-testid="input-patient-weight"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">{t.contactNumber}</Label>
                <Input
                  id="contact"
                  value={newPatient.contactNumber}
                  onChange={(e) => setNewPatient({ ...newPatient, contactNumber: e.target.value })}
                  data-testid="input-patient-contact"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t.address}</Label>
                <Input
                  id="address"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  data-testid="input-patient-address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel">
                {t.cancel}
              </Button>
              <Button onClick={handleAddPatient} disabled={addPatientMutation.isPending} data-testid="button-save-patient">
                {addPatientMutation.isPending ? t.loading : t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Patient Records
          </CardTitle>
          <CardDescription>Search and view patient information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPatients}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-patients"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t.loading}</div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-patients">{t.noPatients}</div>
          ) : (
            <div className="grid gap-3">
              {filteredPatients.map((patient) => (
                <Card key={patient.id} className="hover-elevate" data-testid={`card-patient-${patient.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-lg" data-testid={`text-patient-name-${patient.id}`}>
                            {patient.name}
                          </p>
                          <Badge variant="outline">{patient.gender}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">{t.age}:</span> {patient.age}
                          </div>
                          {patient.weight && (
                            <div>
                              <span className="font-medium">{t.weight}:</span> {patient.weight} kg
                            </div>
                          )}
                          {patient.contactNumber && (
                            <div>
                              <span className="font-medium">{t.contactNumber}:</span> {patient.contactNumber}
                            </div>
                          )}
                          {patient.address && (
                            <div className="col-span-2">
                              <span className="font-medium">{t.address}:</span> {patient.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
