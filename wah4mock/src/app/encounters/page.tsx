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
import { LuPlus, LuSearch, LuCalendarClock } from 'react-icons/lu';
import type { Encounter, EncounterStatus } from '@/lib/types/fhir';

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

export default function EncountersPage() {
  const router = useRouter();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEncounters();
  }, []);

  async function fetchEncounters() {
    try {
      const res = await fetch('/api/fhir/Encounter');
      const data = await res.json();
      const list = data.entry?.map((e: { resource: Encounter }) => e.resource) || [];
      // Sort by date, most recent first
      list.sort((a: Encounter, b: Encounter) => {
        const dateA = a.period?.start ? new Date(a.period.start).getTime() : 0;
        const dateB = b.period?.start ? new Date(b.period.start).getTime() : 0;
        return dateB - dateA;
      });
      setEncounters(list);
    } catch (error) {
      console.error('Failed to fetch encounters:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEncounters = encounters.filter((encounter) => {
    if (!searchQuery) return true;
    const patientName = encounter.subject?.display?.toLowerCase() || '';
    const practitionerName = encounter.participant?.[0]?.individual?.display?.toLowerCase() || '';
    const reason = encounter.reasonCode?.[0]?.text?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return patientName.includes(query) || practitionerName.includes(query) || reason.includes(query);
  });

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 py-4 -mt-4 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Encounters</h1>
          <p className="text-slate-500 mt-1">Manage patient visits and consultations</p>
        </div>
        <Link href="/encounters/create">
          <Button>
            <LuPlus className="w-4 h-4" />
            New Encounter
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Encounter Records</CardTitle>
            <div className="relative w-full sm:w-64">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search encounters..."
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
            </div>
          ) : filteredEncounters.length === 0 ? (
            <EmptyState
              title={searchQuery ? 'No encounters found' : 'No encounters yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating your first encounter'
              }
              action={
                !searchQuery && (
                  <Link href="/encounters/create">
                    <Button>
                      <LuPlus className="w-4 h-4" />
                      New Encounter
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden md:table-cell">Practitioner</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEncounters.map((encounter) => (
                  <TableRow
                    key={encounter.id}
                    onClick={() => router.push(`/encounters/${encounter.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <LuCalendarClock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm">
                            {formatDate(encounter.period?.start)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900">
                        {encounter.subject?.display || '—'}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {encounter.participant?.[0]?.individual?.display || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {encounter.class?.display || encounter.class?.code || '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <p className="truncate max-w-xs">
                        {encounter.reasonCode?.[0]?.text || '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(encounter.status)}>
                        {encounter.status}
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