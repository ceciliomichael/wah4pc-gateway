'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LuArrowLeft } from 'react-icons/lu';
import type { PatientFormData } from '@/lib/types/fhir';
import { buildPatientFromFormData } from '@/lib/fhir';
import { PatientForm } from '@/components/patients/PatientForm';

export default function PatientRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: PatientFormData) {
    setLoading(true);
    try {
      const patient = buildPatientFromFormData(formData);

      const res = await fetch('/api/fhir/Patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.issue?.[0]?.diagnostics || 'Failed to create patient');
      }

      router.push('/patients');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/patients"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Patients
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Register Patient</h1>
        <p className="text-slate-500 mt-1">Create a new PHCore-compliant patient record</p>
      </div>

      <PatientForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/patients')}
        isLoading={loading}
        submitLabel="Register Patient"
      />
    </div>
  );
}