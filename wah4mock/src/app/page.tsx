'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { LuUsers, LuUserCog, LuCalendarClock, LuArrowRight, LuActivity } from 'react-icons/lu';

const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || 'FHIR Clinic';

interface DashboardStats {
  patients: number;
  practitioners: number;
  encounters: number;
  todayEncounters: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    patients: 0,
    practitioners: 0,
    encounters: 0,
    todayEncounters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [patientsRes, practitionersRes, encountersRes] = await Promise.all([
          fetch('/api/fhir/Patient'),
          fetch('/api/fhir/Practitioner'),
          fetch('/api/fhir/Encounter'),
        ]);

        const [patients, practitioners, encounters] = await Promise.all([
          patientsRes.json(),
          practitionersRes.json(),
          encountersRes.json(),
        ]);

        const today = new Date().toISOString().split('T')[0];
        const todayEncounters = encounters.entry?.filter((e: { resource: { period?: { start?: string } } }) => 
          e.resource?.period?.start?.startsWith(today)
        ).length || 0;

        setStats({
          patients: patients.total || 0,
          practitioners: practitioners.total || 0,
          encounters: encounters.total || 0,
          todayEncounters,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.patients,
      icon: <LuUsers className="w-6 h-6" />,
      href: '/patients',
      color: 'bg-teal-500',
    },
    {
      title: 'Practitioners',
      value: stats.practitioners,
      icon: <LuUserCog className="w-6 h-6" />,
      href: '/practitioners',
      color: 'bg-sky-500',
    },
    {
      title: 'Total Encounters',
      value: stats.encounters,
      icon: <LuCalendarClock className="w-6 h-6" />,
      href: '/encounters',
      color: 'bg-amber-500',
    },
    {
      title: "Today's Visits",
      value: stats.todayEncounters,
      icon: <LuActivity className="w-6 h-6" />,
      href: '/encounters',
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 py-4 -mt-4 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome to {clinicName} Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {loading ? '—' : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  {stat.icon}
                </div>
              </div>
              <Link
                href={stat.href}
                className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 mt-4"
              >
                View all
                <LuArrowRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/patients/register"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <LuUsers className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Register Patient</p>
                <p className="text-sm text-slate-500">Add new patient record</p>
              </div>
            </Link>

            <Link
              href="/practitioners/register"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <LuUserCog className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Add Practitioner</p>
                <p className="text-sm text-slate-500">Register healthcare provider</p>
              </div>
            </Link>

            <Link
              href="/encounters/create"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <LuCalendarClock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Create Encounter</p>
                <p className="text-sm text-slate-500">Start a patient visit</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}