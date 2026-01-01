import type { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  iconBgColor?: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  iconBgColor = "bg-blue-50 text-blue-600",
  className = "",
}: FeatureCardProps) {
  return (
    <div className={`group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-blue-300 hover:shadow-lg ${className}`}>
      <div className={`mb-4 inline-flex rounded-xl p-3 shadow-sm ${iconBgColor}`}>
        {icon}
      </div>
      <h3 className="mb-2 font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

interface CompactFeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  iconBgColor?: string;
  className?: string;
}

export function CompactFeatureCard({
  icon,
  title,
  description,
  iconBgColor = "bg-purple-50 text-purple-600",
  className = "",
}: CompactFeatureCardProps) {
  return (
    <div className={`group rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-purple-200 hover:shadow-md ${className}`}>
      <div className={`mb-3 inline-flex rounded-lg p-2 ${iconBgColor}`}>
        {icon}
      </div>
      <h3 className="mb-1 text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-600">{description}</p>
    </div>
  );
}