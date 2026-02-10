'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  EmptyState,
  Input,
} from '@/components/ui';
import { LuPlus, LuSearch, LuCalendarCheck } from 'react-icons/lu';
import type { Appointment, AppointmentStatus } from '@/lib/types/fhir';

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

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPatientDisplay(appointment: Appointment): string {
  const participant = appointment.participant?.find(
    (p) => p.actor?.reference?.startsWith('Patient/')
  );
  return participant?.actor?.display || '—';
}

function getPractitionerDisplay(appointment: Appointment): string {
  const participant = appointment.participant?.find(
    (p) => p.actor?.reference?.startsWith('Practitioner/')
  );
  return participant?.actor?.display || '—';
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      const res = await fetch('/api/fhir/Appointment');
      const data = await res.json();
      const list = data.entry?.map((e: { resource: Appointment }) => e.resource) || [];
      // Sort by start date, most recent first
      list.sort((a: Appointment, b: Appointment) => {
        const dateA = a.start ? new Date(a.start).getTime() : 0;
        const dateB = b.start ? new Date(b.start).getTime() : 0;
        return dateB - dateA;
      });
      setAppointments(list);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    if (!searchQuery) return true;
    const patientName = getPatientDisplay(appointment).toLowerCase();
    const practitionerName = getPractitionerDisplay(appointment).toLowerCase();
    const description = appointment.description?.toLowerCase() || '';
    const reason = appointment.reasonCode?.[0]?.text?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return (
      patientName.includes(query) ||
      practitionerName.includes(query) ||
      description.includes(query) ||
      reason.includes(query)
    );
  });

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 py-4 -mt-4 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 mt-1">Schedule and manage patient appointments</p>
        </div>
        <Link href="/appointments/create">
          <Button>
            <LuPlus className="w-4 h-4" />
            New Appointment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Appointment Records</CardTitle>
            <div className="relative w-full sm:w-64">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              title={searchQuery ? 'No appointments found' : 'No appointments yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating your first appointment'
              }
              action={
                !searchQuery && (
                  <Link href="/appointments/create">
                    <Button>
                      <LuPlus className="w-4 h-4" />
                      New Appointment
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden md:table-cell">Practitioner</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow
                    key={appointment.id}
                    onClick={() => router.push(`/appointments/${appointment.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <LuCalendarCheck className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm">
                            {formatDate(appointment.start)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900">
                        {getPatientDisplay(appointment)}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getPractitionerDisplay(appointment)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {appointment.appointmentType?.coding?.[0]?.display || '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <p className="truncate max-w-xs">
                        {appointment.reasonCode?.[0]?.text || appointment.description || '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}