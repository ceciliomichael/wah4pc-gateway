interface RequestHeadersProps {
  headers: Record<string, string>;
  className?: string;
}

export function RequestHeaders({ headers, className = "" }: RequestHeadersProps) {
  return (
    <div className={`mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 ${className}`}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Required Headers</p>
      <div className="space-y-1 font-mono text-xs text-slate-600">
        {Object.entries(headers).map(([name, value]) => (
          <div key={name}>
            <span className="text-blue-600 font-semibold">{name}:</span>{" "}
            <span className="text-slate-500">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}