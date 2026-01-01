type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface MethodBadgeProps {
  method: HttpMethod;
  className?: string;
}

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-green-100 text-green-800",
  POST: "bg-blue-100 text-blue-800",
  PUT: "bg-amber-100 text-amber-800",
  DELETE: "bg-red-100 text-red-800",
  PATCH: "bg-purple-100 text-purple-800",
};

export function MethodBadge({ method, className = "" }: MethodBadgeProps) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${methodColors[method]} ${className}`}
    >
      {method}
    </span>
  );
}

interface EndpointDisplayProps {
  method: HttpMethod;
  path: string;
  className?: string;
}

export function EndpointDisplay({ method, path, className = "" }: EndpointDisplayProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MethodBadge method={method} />
      <code className="text-sm text-slate-700">{path}</code>
    </div>
  );
}