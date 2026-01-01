import type { ReactNode } from "react";

interface StepSectionProps {
  stepNumber: number;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function StepSection({
  stepNumber,
  title,
  description,
  children,
  className = "",
  id,
}: StepSectionProps) {
  return (
    <section id={id} className={`mb-12 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          {stepNumber}
        </span>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      </div>
      {description && (
        <p className="mb-6 text-slate-600">{description}</p>
      )}
      {children}
    </section>
  );
}

interface StepItemProps {
  number: number;
  title: string;
  description: string;
}

export function StepItem({ number, title, description }: StepItemProps) {
  return (
    <li className="flex gap-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
        {number}
      </span>
      <div>
        <h4 className="font-semibold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </li>
  );
}