'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { LuArrowLeft } from 'react-icons/lu';
import type { Practitioner, PractitionerFormData } from '@/lib/types/fhir';
import { buildPractitionerFromFormData, extractPractitionerFormData } from '@/lib/fhir';
import { PractitionerForm } from '@/components/practitioners/PractitionerForm';

export default function PractitionerEditPage() {
  const params = useParams();
  const router = useRouter();
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchPractitioner() {
      try {
        const res = await fetch(`/api/fhir/Practitioner/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setPractitioner(data);
        }
      } catch (error) {
        console.error('Failed to fetch practitioner:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchPractitioner();
    }
  }, [params.id]);

  async function handleSubmit(formData: PractitionerFormData) {
    if (!practitioner) return;
    
    setSaving(true);
    try {
      // Build a new practitioner object from form data
      const updatedPractitioner = buildPractitionerFromFormData(formData);
      
      // Preserve the original ID and meta info
      updatedPractitioner.id = practitioner.id;
      updatedPractitioner.meta = {
        ...updatedPractitioner.meta,
        versionId: practitioner.meta?.versionId,
      };

      const res = await fetch(`/api/fhir/Practitioner/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPractitioner),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.issue?.[0]?.diagnostics || 'Failed to update practitioner');
      }

      router.push(`/practitioners/${params.id}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    );
  }

  if (!practitioner) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Practitioner not found</h2>
          <Link href="/practitioners">
            <Button variant="outline">Back to Practitioners</Button>
          </Link>
        </div>
      </div>
    );
  }

  const defaultValues = extractPractitionerFormData(practitioner);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href={`/practitioners/${params.id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Practitioner
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Edit Practitioner</h1>
        <p className="text-slate-500 mt-1">Update practitioner information</p>
      </div>

      <PractitionerForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/practitioners/${params.id}`)}
        isLoading={saving}
        submitLabel="Save Changes"
      />
    </div>
  );
}