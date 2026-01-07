'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LuLayoutDashboard,
  LuUsers,
  LuUserCog,
  LuCalendarClock,
  LuHeart,
  LuMenu,
  LuX,
  LuArrowLeftRight,
} from 'react-icons/lu';
import { useState } from 'react';

const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || 'FHIR Clinic';
import clsx from 'clsx';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: <LuLayoutDashboard className="w-5 h-5" />,
  },
  {
    href: '/patients',
    label: 'Patients',
    icon: <LuUsers className="w-5 h-5" />,
  },
  {
    href: '/practitioners',
    label: 'Practitioners',
    icon: <LuUserCog className="w-5 h-5" />,
  },
  {
    href: '/encounters',
    label: 'Encounters',
    icon: <LuCalendarClock className="w-5 h-5" />,
  },
  {
    href: '/integration',
    label: 'Integration',
    icon: <LuArrowLeftRight className="w-5 h-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg border border-slate-200 bg-white md:hidden"
        aria-label="Open menu"
      >
        <LuMenu className="w-6 h-6 text-slate-700" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close menu overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out',
          'md:translate-x-0 md:static md:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <LuHeart className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-800">{clinicName}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-100 md:hidden"
            aria-label="Close menu"
          >
            <LuX className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="text-xs text-slate-400 text-center">
            FHIR R4 • PHCore Compliant
          </div>
        </div>
      </aside>
    </>
  );
}