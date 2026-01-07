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
import { LuArrowLeft, LuPencil, LuTrash2, LuUserCog, LuPhone, LuMail, LuMapPin, LuBriefcase } from 'react-icons/lu';
import type { Practitioner } from '@/lib/types/fhir';
import { getDisplayName, getPhone, getEmail, formatAddress } from '@/lib/fhir';

export default function PractitionerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this practitioner record?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/fhir/Practitioner/${params.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/practitioners');
      }
    } catch (error) {
      console.error('Failed to delete practitioner:', error);
    } finally {
      setDeleting(false);
    }
  }

  function getLicenseNumber(prac: Practitioner): string | undefined {
    return prac.identifier?.find((id) => id.system?.includes('license'))?.value;
  }

  function getSpecialty(prac: Practitioner): string {
    return prac.qualification?.[0]?.code?.text || '—';
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

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/practitioners"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Practitioners
        </Link>
      </div>

      {/* Header Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                <LuUserCog className="w-8 h-8 text-sky-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {getDisplayName(practitioner)}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={practitioner.active !== false ? 'success' : 'default'}>
                    {practitioner.active !== false ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-slate-500">{getSpecialty(practitioner)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDelete} isLoading={deleting}>
                <LuTrash2 className="w-4 h-4" />
                Delete
              </Button>
              <Link href={`/practitioners/${params.id}/edit`}>
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
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <LuPhone className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">Phone</dt>
                  <dd className="text-slate-900">{getPhone(practitioner.telecom) || '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <LuMail className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">Email</dt>
                  <dd className="text-slate-900">{getEmail(practitioner.telecom) || '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <LuMapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">Address</dt>
                  <dd className="text-slate-900">{formatAddress(practitioner.address?.[0]) || '—'}</dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <LuBriefcase className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">Specialty</dt>
                  <dd className="text-slate-900">{getSpecialty(practitioner)}</dd>
                </div>
              </div>
              <div>
                <dt className="text-sm text-slate-500">PRC License Number</dt>
                <dd className="text-slate-900 font-mono">
                  {getLicenseNumber(practitioner) || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Gender</dt>
                <dd className="text-slate-900 capitalize">
                  {practitioner.gender || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Date of Birth</dt>
                <dd className="text-slate-900">
                  {practitioner.birthDate || '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}