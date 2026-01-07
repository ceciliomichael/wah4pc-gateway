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
import { LuArrowLeft, LuPencil, LuTrash2, LuUser, LuPhone, LuMail, LuMapPin, LuCalendar } from 'react-icons/lu';
import type { Patient } from '@/lib/types/fhir';
import {
  getDisplayName,
  getPhone,
  getEmail,
  formatAddress,
  getPhilHealthId,
  getPddRegistration,
  getExtensionValue,
  PHCORE_EXTENSION_URLS,
} from '@/lib/fhir';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchPatient() {
      try {
        const res = await fetch(`/api/fhir/Patient/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setPatient(data);
        }
      } catch (error) {
        console.error('Failed to fetch patient:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchPatient();
    }
  }, [params.id]);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this patient record?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/fhir/Patient/${params.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/patients');
      }
    } catch (error) {
      console.error('Failed to delete patient:', error);
    } finally {
      setDeleting(false);
    }
  }

  function calculateAge(birthDate: string | undefined): string {
    if (!birthDate) return '—';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} years old`;
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Patient not found</h2>
          <Link href="/patients">
            <Button variant="outline">Back to Patients</Button>
          </Link>
        </div>
      </div>
    );
  }

  const infoItems = [
    { icon: LuCalendar, label: 'Date of Birth', value: patient.birthDate || '—' },
    { icon: LuUser, label: 'Age', value: calculateAge(patient.birthDate) },
    { icon: LuPhone, label: 'Phone', value: getPhone(patient.telecom) || '—' },
    { icon: LuMail, label: 'Email', value: getEmail(patient.telecom) || '—' },
    { icon: LuMapPin, label: 'Address', value: formatAddress(patient.address?.[0]) || '—' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/patients"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Patients
        </Link>
      </div>

      {/* Header Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <LuUser className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {getDisplayName(patient)}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={patient.active !== false ? 'success' : 'default'}>
                    {patient.active !== false ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-slate-500 capitalize">{patient.gender}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDelete} isLoading={deleting}>
                <LuTrash2 className="w-4 h-4" />
                Delete
              </Button>
              <Link href={`/patients/${params.id}/edit`}>
                <Button>
                  <LuPencil className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact & Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Contact & Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {infoItems.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-sm text-slate-500">{item.label}</dt>
                    <dd className="text-slate-900">{item.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* Healthcare Identifiers */}
        <Card>
          <CardHeader>
            <CardTitle>Healthcare Identifiers</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-slate-500">PhilHealth ID</dt>
                <dd className="text-slate-900 font-mono">
                  {getPhilHealthId(patient) || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">PDD Registration</dt>
                <dd className="text-slate-900 font-mono">
                  {getPddRegistration(patient) || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Marital Status</dt>
                <dd className="text-slate-900 capitalize">
                  {patient.maritalStatus?.coding?.[0]?.code || '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* PHCore Extensions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Additional Information (PHCore)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm text-slate-500">Nationality</dt>
                <dd className="text-slate-900">
                  {getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.nationality) as string || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Religion</dt>
                <dd className="text-slate-900">
                  {getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.religion) as string || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Occupation</dt>
                <dd className="text-slate-900">
                  {getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.occupation) as string || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Educational Attainment</dt>
                <dd className="text-slate-900">
                  {getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.educationalAttainment) as string || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Indigenous People</dt>
                <dd className="text-slate-900">
                  {getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.indigenousPeople) ? 'Yes' : 'No'}
                </dd>
              </div>
              {getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.indigenousPeople) && (
                <div>
                  <dt className="text-sm text-slate-500">Indigenous Group</dt>
                  <dd className="text-slate-900">
                    {getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.indigenousGroup) as string || '—'}
                  </dd>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}