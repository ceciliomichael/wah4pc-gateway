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
import { LuPlus, LuSearch, LuUserCog } from 'react-icons/lu';
import type { Practitioner } from '@/lib/types/fhir';
import { getDisplayName, getPhone, getEmail } from '@/lib/fhir';

export default function PractitionersPage() {
  const router = useRouter();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPractitioners();
  }, []);

  async function fetchPractitioners() {
    try {
      const res = await fetch('/api/fhir/Practitioner');
      const data = await res.json();
      const list = data.entry?.map((e: { resource: Practitioner }) => e.resource) || [];
      setPractitioners(list);
    } catch (error) {
      console.error('Failed to fetch practitioners:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPractitioners = practitioners.filter((practitioner) => {
    if (!searchQuery) return true;
    const name = getDisplayName(practitioner).toLowerCase();
    const phone = getPhone(practitioner.telecom)?.toLowerCase() || '';
    const email = getEmail(practitioner.telecom)?.toLowerCase() || '';
    const specialty = practitioner.qualification?.[0]?.code?.text?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query) || email.includes(query) || specialty.includes(query);
  });

  function getLicenseNumber(practitioner: Practitioner): string | undefined {
    return practitioner.identifier?.find((id) => id.system?.includes('license'))?.value;
  }

  function getSpecialty(practitioner: Practitioner): string {
    return practitioner.qualification?.[0]?.code?.text || '—';
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 py-4 -mt-4 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Practitioners</h1>
          <p className="text-slate-500 mt-1">Manage healthcare providers</p>
        </div>
        <Link href="/practitioners/register">
          <Button>
            <LuPlus className="w-4 h-4" />
            Add Practitioner
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Practitioner Records</CardTitle>
            <div className="relative w-full sm:w-64">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search practitioners..."
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
            </div>
          ) : filteredPractitioners.length === 0 ? (
            <EmptyState
              title={searchQuery ? 'No practitioners found' : 'No practitioners yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by adding your first practitioner'
              }
              action={
                !searchQuery && (
                  <Link href="/practitioners/register">
                    <Button>
                      <LuPlus className="w-4 h-4" />
                      Add Practitioner
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Specialty</TableHead>
                  <TableHead className="hidden lg:table-cell">License No.</TableHead>
                  <TableHead className="hidden sm:table-cell">Contact</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPractitioners.map((practitioner) => (
                  <TableRow
                    key={practitioner.id}
                    onClick={() => router.push(`/practitioners/${practitioner.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                          <LuUserCog className="w-4 h-4 text-sky-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {getDisplayName(practitioner)}
                          </p>
                          <p className="text-xs text-slate-500 md:hidden">
                            {getSpecialty(practitioner)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getSpecialty(practitioner)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-mono text-xs">
                        {getLicenseNumber(practitioner) || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div>
                        <p>{getPhone(practitioner.telecom) || '—'}</p>
                        <p className="text-xs text-slate-500">{getEmail(practitioner.telecom) || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={practitioner.active !== false ? 'success' : 'default'}>
                        {practitioner.active !== false ? 'Active' : 'Inactive'}
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