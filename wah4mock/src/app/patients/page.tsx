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
import { LuPlus, LuSearch, LuUser } from 'react-icons/lu';
import type { Patient } from '@/lib/types/fhir';
import { getDisplayName, getPhone, formatAddress, getPhilHealthId } from '@/lib/fhir';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    try {
      const res = await fetch('/api/fhir/Patient');
      const data = await res.json();
      const patientList = data.entry?.map((e: { resource: Patient }) => e.resource) || [];
      setPatients(patientList);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery) return true;
    const name = getDisplayName(patient).toLowerCase();
    const phone = getPhone(patient.telecom)?.toLowerCase() || '';
    const philHealthId = getPhilHealthId(patient)?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query) || philHealthId.includes(query);
  });

  function calculateAge(birthDate: string | undefined): string {
    if (!birthDate) return '—';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} yrs`;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 py-4 -mt-4 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500 mt-1">Manage patient records</p>
        </div>
        <Link href="/patients/register">
          <Button>
            <LuPlus className="w-4 h-4" />
            Register Patient
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Patient Records</CardTitle>
            <div className="relative w-full sm:w-64">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search patients..."
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
          ) : filteredPatients.length === 0 ? (
            <EmptyState
              title={searchQuery ? 'No patients found' : 'No patients yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by registering your first patient'
              }
              action={
                !searchQuery && (
                  <Link href="/patients/register">
                    <Button>
                      <LuPlus className="w-4 h-4" />
                      Register Patient
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
                  <TableHead className="hidden md:table-cell">Age/Gender</TableHead>
                  <TableHead className="hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="hidden xl:table-cell">Address</TableHead>
                  <TableHead className="hidden sm:table-cell">PhilHealth ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <LuUser className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {getDisplayName(patient)}
                          </p>
                          <p className="text-xs text-slate-500 md:hidden">
                            {calculateAge(patient.birthDate)} • {patient.gender || '—'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p>{calculateAge(patient.birthDate)}</p>
                      <p className="text-xs text-slate-500 capitalize">{patient.gender || '—'}</p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p>{getPhone(patient.telecom) || '—'}</p>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <p className="truncate max-w-xs">
                        {formatAddress(patient.address?.[0]) || '—'}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="font-mono text-xs">
                        {getPhilHealthId(patient) || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.active !== false ? 'success' : 'default'}>
                        {patient.active !== false ? 'Active' : 'Inactive'}
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