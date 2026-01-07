'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LuArrowLeft } from 'react-icons/lu';
import type { PractitionerFormData } from '@/lib/types/fhir';
import { buildPractitionerFromFormData } from '@/lib/fhir';
import { PractitionerForm } from '@/components/practitioners/PractitionerForm';

export default function PractitionerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: PractitionerFormData) {
    setLoading(true);
    try {
      const practitioner = buildPractitionerFromFormData(formData);

      const res = await fetch('/api/fhir/Practitioner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(practitioner),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.issue?.[0]?.diagnostics || 'Failed to create practitioner');
      }

      router.push('/practitioners');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/practitioners"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Practitioners
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Add Practitioner</h1>
        <p className="text-slate-500 mt-1">Register a new healthcare provider</p>
      </div>

      <PractitionerForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/practitioners')}
        isLoading={loading}
        submitLabel="Add Practitioner"
      />
    </div>
  );
}