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
  Textarea,
} from '@/components/ui';
import { LuSave } from 'react-icons/lu';
import type { Patient, Practitioner, AppointmentFormData } from '@/lib/types/fhir';
import {
  getDisplayName,
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS,
  APPOINTMENT_TYPE_DISPLAY_MAP,
  SERVICE_TYPE_OPTIONS,
  SERVICE_TYPE_DISPLAY_MAP,
  SPECIALTY_OPTIONS,
  SPECIALTY_DISPLAY_MAP,
} from '@/lib/fhir';

const priorityOptions = [
  { value: '0', label: 'Routine (0)' },
  { value: '1', label: 'Urgent (1)' },
  { value: '2', label: 'Semi-urgent (2)' },
  { value: '5', label: 'Low Priority (5)' },
  { value: '9', label: 'Callback (9)' },
];

const DEFAULT_FORM_DATA: AppointmentFormData = {
  patientId: '',
  practitionerId: '',
  status: 'proposed',
  appointmentTypeCode: '',
  appointmentTypeDisplay: '',
  serviceTypeCode: '',
  serviceTypeDisplay: '',
  specialtyCode: '',
  specialtyDisplay: '',
  reasonText: '',
  description: '',
  comment: '',
  priority: 0,
  start: new Date().toISOString().slice(0, 16),
  end: '',
  minutesDuration: undefined,
  patientInstruction: '',
};

interface AppointmentFormProps {
  defaultValues?: Partial<AppointmentFormData>;
  patients: Patient[];
  practitioners: Practitioner[];
  onSubmit: (data: AppointmentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function AppointmentForm({
  defaultValues,
  patients,
  practitioners,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Appointment',
}: AppointmentFormProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({
    ...DEFAULT_FORM_DATA,
    ...defaultValues,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultValues) {
      setFormData((prev) => ({ ...prev, ...defaultValues }));
    }
  }, [defaultValues]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    if (name === 'appointmentTypeCode') {
      setFormData((prev) => ({
        ...prev,
        appointmentTypeCode: value,
        appointmentTypeDisplay: APPOINTMENT_TYPE_DISPLAY_MAP[value] || value,
      }));
    } else if (name === 'serviceTypeCode') {
      setFormData((prev) => ({
        ...prev,
        serviceTypeCode: value,
        serviceTypeDisplay: SERVICE_TYPE_DISPLAY_MAP[value] || value,
      }));
    } else if (name === 'specialtyCode') {
      setFormData((prev) => ({
        ...prev,
        specialtyCode: value,
        specialtyDisplay: SPECIALTY_DISPLAY_MAP[value] || value,
      }));
    } else if (name === 'priority') {
      setFormData((prev) => ({
        ...prev,
        priority: value ? parseInt(value, 10) : 0,
      }));
    } else if (name === 'minutesDuration') {
      setFormData((prev) => ({
        ...prev,
        minutesDuration: value ? parseInt(value, 10) : undefined,
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
      if (!formData.start) {
        throw new Error('Please set a start date and time');
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

        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>Type, status, and scheduling information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={APPOINTMENT_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                required
              />
              <Select
                label="Appointment Type"
                name="appointmentTypeCode"
                value={formData.appointmentTypeCode || ''}
                onChange={handleChange}
                options={APPOINTMENT_TYPE_OPTIONS}
                placeholder="Select type"
                hint="Reason for appointment"
              />
              <Select
                label="Service Type"
                name="serviceTypeCode"
                value={formData.serviceTypeCode || ''}
                onChange={handleChange}
                options={SERVICE_TYPE_OPTIONS}
                placeholder="Select service"
                hint="Type of medical service"
              />
              <Select
                label="Specialty"
                name="specialtyCode"
                value={formData.specialtyCode || ''}
                onChange={handleChange}
                options={SPECIALTY_OPTIONS}
                placeholder="Select specialty"
              />
              <Select
                label="Priority"
                name="priority"
                value={String(formData.priority || 0)}
                onChange={handleChange}
                options={priorityOptions}
                hint="0 = routine, 1 = urgent"
              />
              <Input
                label="Duration (minutes)"
                name="minutesDuration"
                type="number"
                value={formData.minutesDuration !== undefined ? String(formData.minutesDuration) : ''}
                onChange={handleChange}
                placeholder="e.g., 30"
                hint="Expected duration"
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Set the appointment date and time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date & Time"
                name="start"
                type="datetime-local"
                value={formData.start}
                onChange={handleChange}
                required
              />
              <Input
                label="End Date & Time"
                name="end"
                type="datetime-local"
                value={formData.end || ''}
                onChange={handleChange}
                hint="Leave empty to auto-calculate from duration"
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Reason, notes, and patient instructions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                label="Reason for Appointment"
                name="reasonText"
                value={formData.reasonText || ''}
                onChange={handleChange}
                placeholder="e.g., Follow-up consultation, Annual physical exam"
                rows={2}
              />
              <Textarea
                label="Description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="Brief description of the appointment"
                rows={2}
              />
              <Textarea
                label="Comment"
                name="comment"
                value={formData.comment || ''}
                onChange={handleChange}
                placeholder="Internal notes about this appointment"
                rows={2}
              />
              <Textarea
                label="Patient Instructions"
                name="patientInstruction"
                value={formData.patientInstruction || ''}
                onChange={handleChange}
                placeholder="e.g., Please fast for 12 hours before your visit"
                rows={2}
              />
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

export default AppointmentForm;