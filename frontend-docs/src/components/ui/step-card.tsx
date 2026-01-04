interface StepCardProps {
  stepNumber: number;
  title: string;
  endpoint: string;
  actor: string;
  description: string;
  children: React.ReactNode;
}

export function StepCard({ stepNumber, title, endpoint, actor, description, children }: StepCardProps) {
  return (
    <div className="mb-12 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-200">
            {stepNumber}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm mt-1">
              <code className="text-blue-600 font-bold font-mono bg-blue-50 px-1.5 py-0.5 rounded">{endpoint}</code>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">{actor}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <p className="mb-6 text-slate-600 leading-relaxed">{description}</p>
        {children}
      </div>
    </div>
  );
}