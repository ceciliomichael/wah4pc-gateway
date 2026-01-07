'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button } from '@/components/ui';
import { LuArrowLeft } from 'react-icons/lu';
import type { Patient, Practitioner, EncounterFormData } from '@/lib/types/fhir';
import { buildEncounterFromFormData } from '@/lib/fhir';
import { EncounterForm } from '@/components/encounters/EncounterForm';

export default function CreateEncounterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [fetchingResources, setFetchingResources] = useState(true);

  useEffect(() => {
    async function fetchResources() {
      try {
        const [patientsRes, practitionersRes] = await Promise.all([
          fetch('/api/fhir/Patient'),
          fetch('/api/fhir/Practitioner'),
        ]);

        const [patientsData, practitionersData] = await Promise.all([
          patientsRes.json(),
          practitionersRes.json(),
        ]);

        setPatients(patientsData.entry?.map((e: { resource: Patient }) => e.resource) || []);
        setPractitioners(practitionersData.entry?.map((e: { resource: Practitioner }) => e.resource) || []);
      } catch (err) {
        console.error('Failed to fetch resources:', err);
      } finally {
        setFetchingResources(false);
      }
    }

    fetchResources();
  }, []);

  async function handleSubmit(formData: EncounterFormData) {
    setLoading(true);
    try {
      const patient = patients.find((p) => p.id === formData.patientId);
      const practitioner = practitioners.find((p) => p.id === formData.practitionerId);

      if (!patient || !practitioner) {
        throw new Error('Selected patient or practitioner not found');
      }

      const encounter = buildEncounterFromFormData(formData, patient, practitioner);

      const res = await fetch('/api/fhir/Encounter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encounter),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.issue?.[0]?.diagnostics || 'Failed to create encounter');
      }

      router.push('/encounters');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/encounters"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Encounters
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Create Encounter</h1>
        <p className="text-slate-500 mt-1">Record a new patient visit or consultation</p>
      </div>

      {fetchingResources ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
        </div>
      ) : patients.length === 0 || practitioners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600 mb-4">
              You need at least one patient and one practitioner to create an encounter.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {patients.length === 0 && (
                <Link href="/patients/register">
                  <Button variant="outline">Register Patient</Button>
                </Link>
              )}
              {practitioners.length === 0 && (
                <Link href="/practitioners/register">
                  <Button variant="outline">Add Practitioner</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EncounterForm
          patients={patients}
          practitioners={practitioners}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/encounters')}
          isLoading={loading}
          submitLabel="Create Encounter"
        />
      )}
    </div>
  );
}