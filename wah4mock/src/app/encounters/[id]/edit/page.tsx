'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent } from '@/components/ui';
import { LuArrowLeft } from 'react-icons/lu';
import type { Encounter, Patient, Practitioner, EncounterFormData } from '@/lib/types/fhir';
import { extractEncounterFormData, getDisplayName } from '@/lib/fhir';
import { EncounterForm } from '@/components/encounters/EncounterForm';

export default function EncounterEditPage() {
  const params = useParams();
  const router = useRouter();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [encounterRes, patientsRes, practitionersRes] = await Promise.all([
          fetch(`/api/fhir/Encounter/${params.id}`),
          fetch('/api/fhir/Patient'),
          fetch('/api/fhir/Practitioner'),
        ]);

        if (encounterRes.ok) {
          const encounterData = await encounterRes.json();
          setEncounter(encounterData);
        }

        const [patientsData, practitionersData] = await Promise.all([
          patientsRes.json(),
          practitionersRes.json(),
        ]);

        setPatients(patientsData.entry?.map((e: { resource: Patient }) => e.resource) || []);
        setPractitioners(practitionersData.entry?.map((e: { resource: Practitioner }) => e.resource) || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  async function handleSubmit(formData: EncounterFormData) {
    if (!encounter) return;
    
    setSaving(true);
    try {
      const patient = patients.find((p) => p.id === formData.patientId);
      const practitioner = practitioners.find((p) => p.id === formData.practitionerId);

      if (!patient || !practitioner) {
        throw new Error('Selected patient or practitioner not found');
      }

      // Build updated encounter while preserving ID and history
      const updatedEncounter: Encounter = {
        ...encounter,
        status: formData.status,
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: formData.classCode,
          display: formData.classDisplay,
        },
        subject: {
          reference: `Patient/${patient.id}`,
          display: getDisplayName(patient),
        },
        participant: [
          {
            individual: {
              reference: `Practitioner/${practitioner.id}`,
              display: getDisplayName(practitioner),
            },
          },
        ],
        period: {
          start: formData.startDate,
          end: formData.endDate || undefined,
        },
        reasonCode: formData.reasonText ? [{ text: formData.reasonText }] : undefined,
      };

      const res = await fetch(`/api/fhir/Encounter/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEncounter),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.issue?.[0]?.diagnostics || 'Failed to update encounter');
      }

      router.push(`/encounters/${params.id}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (!encounter) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Encounter not found</h2>
          <Link href="/encounters">
            <Button variant="outline">Back to Encounters</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (patients.length === 0 || practitioners.length === 0) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600 mb-4">
              Missing required resources to edit this encounter.
            </p>
            <Link href={`/encounters/${params.id}`}>
              <Button variant="outline">Back to Encounter</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultValues = extractEncounterFormData(encounter);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href={`/encounters/${params.id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Encounter
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Edit Encounter</h1>
        <p className="text-slate-500 mt-1">Update encounter details</p>
      </div>

      <EncounterForm
        defaultValues={defaultValues}
        patients={patients}
        practitioners={practitioners}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/encounters/${params.id}`)}
        isLoading={saving}
        submitLabel="Save Changes"
      />
    </div>
  );
}