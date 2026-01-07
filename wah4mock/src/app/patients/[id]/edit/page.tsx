'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { LuArrowLeft } from 'react-icons/lu';
import type { Patient, PatientFormData } from '@/lib/types/fhir';
import { buildPatientFromFormData, extractPatientFormData } from '@/lib/fhir';
import { PatientForm } from '@/components/patients/PatientForm';

export default function PatientEditPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchPatient() {
      try {
        const res = await fetch(`/api/fhir/Patient/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setPatient(data);
        }
      } catch (error) {
        console.error('Failed to fetch patient:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchPatient();
    }
  }, [params.id]);

  async function handleSubmit(formData: PatientFormData) {
    if (!patient) return;
    
    setSaving(true);
    try {
      // Build a new patient object from form data
      const updatedPatient = buildPatientFromFormData(formData);
      
      // Preserve the original ID and meta info
      updatedPatient.id = patient.id;
      updatedPatient.meta = {
        ...updatedPatient.meta,
        versionId: patient.meta?.versionId,
      };

      const res = await fetch(`/api/fhir/Patient/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatient),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.issue?.[0]?.diagnostics || 'Failed to update patient');
      }

      router.push(`/patients/${params.id}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Patient not found</h2>
          <Link href="/patients">
            <Button variant="outline">Back to Patients</Button>
          </Link>
        </div>
      </div>
    );
  }

  const defaultValues = extractPatientFormData(patient);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href={`/patients/${params.id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Patient
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Edit Patient</h1>
        <p className="text-slate-500 mt-1">Update patient information</p>
      </div>

      <PatientForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/patients/${params.id}`)}
        isLoading={saving}
        submitLabel="Save Changes"
      />
    </div>
  );
}