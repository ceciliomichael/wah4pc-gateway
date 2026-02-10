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
import {
  LuArrowLeft,
  LuTrash2,
  LuCalendarCheck,
  LuUser,
  LuUserCog,
  LuClock,
  LuFileText,
  LuPencil,
  LuSend,
  LuTag,
  LuStethoscope,
  LuMessageSquare,
  LuInfo,
} from 'react-icons/lu';
import type { Appointment, AppointmentStatus } from '@/lib/types/fhir';
import type { Provider } from '@/lib/types/integration';

function getStatusVariant(status: AppointmentStatus): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'fulfilled':
      return 'success';
    case 'booked':
    case 'checked-in':
    case 'arrived':
      return 'info';
    case 'proposed':
    case 'pending':
    case 'waitlist':
      return 'warning';
    case 'cancelled':
    case 'noshow':
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

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Push modal state
  const [showPushModal, setShowPushModal] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [pushReason, setPushReason] = useState('');
  const [pushNotes, setPushNotes] = useState('');
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);

  useEffect(() => {
    async function fetchAppointment() {
      try {
        const res = await fetch(`/api/fhir/Appointment/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointment(data);
        }
      } catch (error) {
        console.error('Failed to fetch appointment:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchAppointment();
    }
  }, [params.id]);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/fhir/Appointment/${params.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/appointments');
      }
    } catch (error) {
      console.error('Failed to delete appointment:', error);
    } finally {
      setDeleting(false);
    }
  }

  async function handleOpenPushModal() {
    setShowPushModal(true);
    setPushResult(null);
    setSelectedProviderId('');
    setPushReason('New Appointment Request');
    setPushNotes('');

    if (providers.length === 0) {
      setLoadingProviders(true);
      try {
        const res = await fetch('/api/integration/providers');
        if (res.ok) {
          const data = await res.json();
          setProviders(data.providers || []);
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      } finally {
        setLoadingProviders(false);
      }
    }
  }

  async function handlePush() {
    if (!appointment || !selectedProviderId) return;

    setPushing(true);
    setPushResult(null);

    try {
      const res = await fetch('/api/integration/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: selectedProviderId,
          resourceType: 'Appointment',
          data: appointment,
          reason: pushReason || undefined,
          notes: pushNotes || undefined,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setPushResult({ success: true, message: result.message || 'Appointment pushed successfully' });
      } else {
        setPushResult({ success: false, message: result.error || result.message || 'Push failed' });
      }
    } catch (error) {
      setPushResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to push appointment',
      });
    } finally {
      setPushing(false);
    }
  }

  // Extract participant info
  const patientParticipant = appointment?.participant?.find(
    (p) => p.actor?.reference?.startsWith('Patient/')
  );
  const practitionerParticipant = appointment?.participant?.find(
    (p) => p.actor?.reference?.startsWith('Practitioner/')
  );

  if (loading) {
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
          href="/appointments"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Appointments
        </Link>
      </div>

      {/* Header Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <LuCalendarCheck className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {appointment.appointmentType?.coding?.[0]?.display || 'Appointment'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getStatusVariant(appointment.status)}>
                    {appointment.status}
                  </Badge>
                  <span className="text-slate-500">
                    {formatDateTime(appointment.start)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleOpenPushModal}>
                <LuSend className="w-4 h-4" />
                Push to Provider
              </Button>
              <Link href={`/appointments/${params.id}/edit`}>
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
                    {patientParticipant?.actor?.display || '—'}
                  </dd>
                  {patientParticipant?.actor?.reference && (
                    <Link
                      href={`/patients/${patientParticipant.actor.reference.replace('Patient/', '')}`}
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
                    {practitionerParticipant?.actor?.display || '—'}
                  </dd>
                  {practitionerParticipant?.actor?.reference && (
                    <Link
                      href={`/practitioners/${practitionerParticipant.actor.reference.replace('Practitioner/', '')}`}
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
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <LuClock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">Start</dt>
                  <dd className="text-slate-900">
                    {formatDateTime(appointment.start)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <LuClock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">End</dt>
                  <dd className="text-slate-900">
                    {appointment.end ? formatDateTime(appointment.end) : '—'}
                  </dd>
                </div>
              </div>
              {appointment.minutesDuration && (
                <div className="flex items-start gap-3">
                  <LuClock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-sm text-slate-500">Duration</dt>
                    <dd className="text-slate-900">{appointment.minutesDuration} minutes</dd>
                  </div>
                </div>
              )}
              {appointment.created && (
                <div className="flex items-start gap-3">
                  <LuInfo className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-sm text-slate-500">Created</dt>
                    <dd className="text-slate-900">{formatDateTime(appointment.created)}</dd>
                  </div>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <LuTag className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">Appointment Type</dt>
                  <dd className="text-slate-900 font-medium">
                    {appointment.appointmentType?.coding?.[0]?.display || '—'}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <LuStethoscope className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">Service Type</dt>
                  <dd className="text-slate-900">
                    {appointment.serviceType?.[0]?.coding?.[0]?.display || '—'}
                  </dd>
                </div>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Specialty</dt>
                <dd className="text-slate-900">
                  {appointment.specialty?.[0]?.coding?.[0]?.display || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Priority</dt>
                <dd className="text-slate-900">
                  {appointment.priority !== undefined ? `${appointment.priority} (${appointment.priority === 0 ? 'Routine' : appointment.priority === 1 ? 'Urgent' : 'Custom'})` : 'Routine'}
                </dd>
              </div>
              {appointment.description && (
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="flex items-start gap-3">
                    <LuFileText className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-sm text-slate-500">Description</dt>
                      <dd className="text-slate-900">{appointment.description}</dd>
                    </div>
                  </div>
                </div>
              )}
              {appointment.reasonCode?.[0]?.text && (
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="flex items-start gap-3">
                    <LuFileText className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-sm text-slate-500">Reason</dt>
                      <dd className="text-slate-900">{appointment.reasonCode[0].text}</dd>
                    </div>
                  </div>
                </div>
              )}
              {appointment.comment && (
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="flex items-start gap-3">
                    <LuMessageSquare className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-sm text-slate-500">Comment</dt>
                      <dd className="text-slate-900">{appointment.comment}</dd>
                    </div>
                  </div>
                </div>
              )}
              {appointment.patientInstruction && (
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="flex items-start gap-3">
                    <LuInfo className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-sm text-slate-500">Patient Instructions</dt>
                      <dd className="text-slate-900">{appointment.patientInstruction}</dd>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Push to Provider Modal */}
      {showPushModal && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowPushModal(false)}
            onKeyDown={(e) => e.key === 'Escape' && setShowPushModal(false)}
            role="button"
            tabIndex={0}
            aria-label="Close push modal"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Push Appointment to Provider</h3>
              <p className="text-sm text-slate-500 mb-4">
                Send this appointment directly to another healthcare provider via the WAH4PC Gateway.
              </p>

              {pushResult && (
                <div
                  className={`p-3 rounded-lg border mb-4 text-sm ${
                    pushResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {pushResult.message}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="push-provider" className="block text-sm font-medium text-slate-700 mb-1">
                    Target Provider
                  </label>
                  {loadingProviders ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600" />
                      Loading providers...
                    </div>
                  ) : (
                    <select
                      id="push-provider"
                      value={selectedProviderId}
                      onChange={(e) => setSelectedProviderId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="">Select a provider</option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.type})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label htmlFor="push-reason" className="block text-sm font-medium text-slate-700 mb-1">
                    Reason
                  </label>
                  <input
                    id="push-reason"
                    type="text"
                    value={pushReason}
                    onChange={(e) => setPushReason(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="e.g., New Appointment Request"
                  />
                </div>

                <div>
                  <label htmlFor="push-notes" className="block text-sm font-medium text-slate-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    id="push-notes"
                    value={pushNotes}
                    onChange={(e) => setPushNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Additional notes for the target provider"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowPushModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePush}
                  isLoading={pushing}
                  className="flex-1"
                  disabled={!selectedProviderId}
                >
                  <LuSend className="w-4 h-4" />
                  Push
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}