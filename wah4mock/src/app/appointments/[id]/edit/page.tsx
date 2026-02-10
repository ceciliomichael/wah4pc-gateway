'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button } from '@/components/ui';
import { LuArrowLeft } from 'react-icons/lu';
import type { Patient, Practitioner, Appointment, AppointmentFormData } from '@/lib/types/fhir';
import { buildAppointmentFromFormData, extractAppointmentFormData } from '@/lib/fhir';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';

export default function EditAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [fetchingResources, setFetchingResources] = useState(true);

  useEffect(() => {
    async function fetchResources() {
      try {
        const [patientsRes, practitionersRes, appointmentRes] = await Promise.all([
          fetch('/api/fhir/Patient'),
          fetch('/api/fhir/Practitioner'),
          fetch(`/api/fhir/Appointment/${params.id}`),
        ]);

        const [patientsData, practitionersData] = await Promise.all([
          patientsRes.json(),
          practitionersRes.json(),
        ]);

        setPatients(patientsData.entry?.map((e: { resource: Patient }) => e.resource) || []);
        setPractitioners(practitionersData.entry?.map((e: { resource: Practitioner }) => e.resource) || []);

        if (appointmentRes.ok) {
          const appointmentData = await appointmentRes.json();
          setAppointment(appointmentData);
        }
      } catch (err) {
        console.error('Failed to fetch resources:', err);
      } finally {
        setFetchingResources(false);
      }
    }

    if (params.id) {
      fetchResources();
    }
  }, [params.id]);

  async function handleSubmit(formData: AppointmentFormData) {
    setLoading(true);
    try {
      const patient = patients.find((p) => p.id === formData.patientId);
      const practitioner = practitioners.find((p) => p.id === formData.practitionerId);

      if (!patient || !practitioner) {
        throw new Error('Selected patient or practitioner not found');
      }

      const updatedAppointment = buildAppointmentFromFormData(formData, patient, practitioner);
      // Preserve the original ID
      updatedAppointment.id = params.id as string;

      const res = await fetch(`/api/fhir/Appointment/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAppointment),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.issue?.[0]?.diagnostics || 'Failed to update appointment');
      }

      router.push(`/appointments/${params.id}`);
    } finally {
      setLoading(false);
    }
  }

  const defaultValues = appointment ? extractAppointmentFormData(appointment) : undefined;

  if (fetchingResources) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Appointment not found</h2>
          <Link href="/appointments">
            <Button variant="outline">Back to Appointments</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href={`/appointments/${params.id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Appointment
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Edit Appointment</h1>
        <p className="text-slate-500 mt-1">Update appointment details</p>
      </div>

      <AppointmentForm
        defaultValues={defaultValues}
        patients={patients}
        practitioners={practitioners}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/appointments/${params.id}`)}
        isLoading={loading}
        submitLabel="Update Appointment"
      />
    </div>
  );
}