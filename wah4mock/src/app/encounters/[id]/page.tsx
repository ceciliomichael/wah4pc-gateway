'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@/components/ui';
import { LuArrowLeft, LuTrash2, LuCalendarClock, LuUser, LuUserCog, LuClock, LuFileText, LuRefreshCw, LuPencil } from 'react-icons/lu';
import type { Encounter, EncounterStatus } from '@/lib/types/fhir';
import { UpdateStatusModal } from '@/components/encounters/UpdateStatusModal';
import { updateEncounterStatus } from '@/lib/fhir/encounter';

function getStatusVariant(status: EncounterStatus): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'finished':
      return 'success';
    case 'in-progress':
      return 'info';
    case 'planned':
    case 'arrived':
    case 'triaged':
      return 'warning';
    case 'cancelled':
    case 'entered-in-error':
      return 'error';
    default:
      return 'default';
  }
}

function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EncounterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEncounter() {
      try {
        const res = await fetch(`/api/fhir/Encounter/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setEncounter(data);
        }
      } catch (error) {
        console.error('Failed to fetch encounter:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchEncounter();
    }
  }, [params.id]);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this encounter record?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/fhir/Encounter/${params.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/encounters');
      }
    } catch (error) {
      console.error('Failed to delete encounter:', error);
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusUpdate(newStatus: EncounterStatus) {
    if (!encounter) return;
    
    setUpdatingStatus(true);
    setStatusError(null);
    
    try {
      // Use the helper to create updated encounter with history
      const result = updateEncounterStatus(encounter, newStatus);
      
      if (!result.success) {
        setStatusError(result.error || 'Failed to update status');
        return;
      }
      
      // Send PUT request to update the encounter
      const res = await fetch(`/api/fhir/Encounter/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.encounter),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.issue?.[0]?.diagnostics || 'Failed to update encounter');
      }
      
      const updated = await res.json();
      setEncounter(updated);
      setIsStatusModalOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      setStatusError(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
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
      </div>

      {/* Header Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <LuCalendarClock className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {encounter.class?.display || encounter.class?.code || 'Encounter'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getStatusVariant(encounter.status)}>
                    {encounter.status}
                  </Badge>
                  <span className="text-slate-500">
                    {formatDateTime(encounter.period?.start)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsStatusModalOpen(true)}>
                <LuRefreshCw className="w-4 h-4" />
                Update Status
              </Button>
              <Link href={`/encounters/${params.id}/edit`}>
                <Button variant="outline">
                  <LuPencil className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
              <Button variant="outline" onClick={handleDelete} isLoading={deleting}>
                <LuTrash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <LuUser className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">Patient</dt>
                  <dd className="text-slate-900 font-medium">
                    {encounter.subject?.display || '—'}
                  </dd>
                  {encounter.subject?.reference && (
                    <Link
                      href={`/patients/${encounter.subject.reference.replace('Patient/', '')}`}
                      className="text-sm text-teal-600 hover:text-teal-700"
                    >
                      View patient record →
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <LuUserCog className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">Practitioner</dt>
                  <dd className="text-slate-900 font-medium">
                    {encounter.participant?.[0]?.individual?.display || '—'}
                  </dd>
                  {encounter.participant?.[0]?.individual?.reference && (
                    <Link
                      href={`/practitioners/${encounter.participant[0].individual.reference.replace('Practitioner/', '')}`}
                      className="text-sm text-teal-600 hover:text-teal-700"
                    >
                      View practitioner record →
                    </Link>
                  )}
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Timing */}
        <Card>
          <CardHeader>
            <CardTitle>Timing</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <LuClock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">Start</dt>
                  <dd className="text-slate-900">
                    {formatDateTime(encounter.period?.start)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <LuClock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">End</dt>
                  <dd className="text-slate-900">
                    {encounter.period?.end ? formatDateTime(encounter.period.end) : 'Ongoing'}
                  </dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Encounter Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <dt className="text-sm text-slate-500">Class</dt>
                <dd className="text-slate-900 font-medium">
                  {encounter.class?.display || encounter.class?.code || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Type</dt>
                <dd className="text-slate-900">
                  {encounter.type?.[0]?.coding?.[0]?.display || encounter.type?.[0]?.text || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Priority</dt>
                <dd className="text-slate-900">
                  {encounter.priority?.coding?.[0]?.display || 'Routine'}
                </dd>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <div className="flex items-start gap-3">
                  <LuFileText className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-sm text-slate-500">Reason for Visit</dt>
                    <dd className="text-slate-900">
                      {encounter.reasonCode?.[0]?.text || '—'}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Update Modal */}
      <UpdateStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusError(null);
        }}
        currentStatus={encounter.status}
        onUpdate={handleStatusUpdate}
        isLoading={updatingStatus}
        error={statusError}
      />
    </div>
  );
}