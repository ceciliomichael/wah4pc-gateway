'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Button,
  Input,
  Select,
} from '@/components/ui';
import { LuSave } from 'react-icons/lu';
import type { Patient, Practitioner, EncounterFormData } from '@/lib/types/fhir';
import { getDisplayName } from '@/lib/fhir';

const statusOptions = [
  { value: 'planned', label: 'Planned' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'finished', label: 'Finished' },
  { value: 'cancelled', label: 'Cancelled' },
];

const classOptions = [
  { value: 'AMB', label: 'Ambulatory (Outpatient)' },
  { value: 'EMER', label: 'Emergency' },
  { value: 'IMP', label: 'Inpatient' },
  { value: 'OBSENC', label: 'Observation Encounter' },
  { value: 'HH', label: 'Home Health' },
  { value: 'VR', label: 'Virtual' },
];

const classDisplayMap: Record<string, string> = {
  AMB: 'Ambulatory',
  EMER: 'Emergency',
  IMP: 'Inpatient',
  OBSENC: 'Observation',
  HH: 'Home Health',
  VR: 'Virtual',
};

const typeOptions = [
  { value: 'GENRL', label: 'General Consultation' },
  { value: 'FOL', label: 'Follow-up Visit' },
  { value: 'CHK', label: 'Check-up / Wellness' },
  { value: 'IMM', label: 'Immunization' },
  { value: 'PROC', label: 'Procedure' },
  { value: 'PREG', label: 'Prenatal Visit' },
  { value: 'PEDS', label: 'Pediatric Visit' },
  { value: 'DIAG', label: 'Diagnostic / Lab' },
  { value: 'OTHER', label: 'Other' },
];

const typeDisplayMap: Record<string, string> = {
  GENRL: 'General Consultation',
  FOL: 'Follow-up Visit',
  CHK: 'Check-up / Wellness',
  IMM: 'Immunization',
  PROC: 'Procedure',
  PREG: 'Prenatal Visit',
  PEDS: 'Pediatric Visit',
  DIAG: 'Diagnostic / Lab',
  OTHER: 'Other',
};

const DEFAULT_FORM_DATA: EncounterFormData = {
  patientId: '',
  practitionerId: '',
  status: 'in-progress',
  classCode: 'AMB',
  classDisplay: 'Ambulatory',
  typeCode: '',
  typeDisplay: '',
  reasonText: '',
  startDate: new Date().toISOString().slice(0, 16),
  endDate: '',
};

interface EncounterFormProps {
  defaultValues?: Partial<EncounterFormData>;
  patients: Patient[];
  practitioners: Practitioner[];
  onSubmit: (data: EncounterFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function EncounterForm({
  defaultValues,
  patients,
  practitioners,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Encounter',
}: EncounterFormProps) {
  const [formData, setFormData] = useState<EncounterFormData>({
    ...DEFAULT_FORM_DATA,
    ...defaultValues,
  });
  const [error, setError] = useState<string | null>(null);

  // Update form when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues) {
      setFormData((prev) => ({ ...prev, ...defaultValues }));
    }
  }, [defaultValues]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    
    if (name === 'classCode') {
      setFormData((prev) => ({
        ...prev,
        classCode: value,
        classDisplay: classDisplayMap[value] || value,
      }));
    } else if (name === 'typeCode') {
      setFormData((prev) => ({
        ...prev,
        typeCode: value,
        typeDisplay: typeDisplayMap[value] || value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.patientId || !formData.practitionerId) {
        throw new Error('Please select both a patient and a practitioner');
      }
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  const patientOptions = patients.map((p) => ({
    value: p.id || '',
    label: getDisplayName(p),
  }));

  const practitionerOptions = practitioners.map((p) => ({
    value: p.id || '',
    label: getDisplayName(p),
  }));

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>Select the patient and attending practitioner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Patient"
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                options={patientOptions}
                placeholder="Select patient"
                required
              />
              <Select
                label="Practitioner"
                name="practitionerId"
                value={formData.practitionerId}
                onChange={handleChange}
                options={practitionerOptions}
                placeholder="Select practitioner"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Encounter Details */}
        <Card>
          <CardHeader>
            <CardTitle>Encounter Details</CardTitle>
            <CardDescription>Visit type and status information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={statusOptions}
                required
              />
              <Select
                label="Class"
                name="classCode"
                value={formData.classCode}
                onChange={handleChange}
                options={classOptions}
                required
                hint="Type of encounter setting"
              />
              <Select
                label="Encounter Type"
                name="typeCode"
                value={formData.typeCode || ''}
                onChange={handleChange}
                options={typeOptions}
                placeholder="Select type"
                hint="Type of visit or service"
              />
              <Input
                label="Start Date & Time"
                name="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
              <Input
                label="End Date & Time"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={handleChange}
                hint="Leave empty if ongoing"
              />
              <div className="md:col-span-2 lg:col-span-3">
                <Input
                  label="Reason for Visit"
                  name="reasonText"
                  value={formData.reasonText}
                  onChange={handleChange}
                  placeholder="e.g., Annual checkup, Follow-up consultation, Fever and cough"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <Card>
          <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
              <LuSave className="w-4 h-4" />
              {submitLabel}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}

export default EncounterForm;