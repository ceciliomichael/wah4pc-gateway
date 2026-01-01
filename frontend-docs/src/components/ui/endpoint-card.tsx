"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check, Terminal } from "lucide-react";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface PathParam {
  name: string;
  type: string;
  description: string;
}

interface HeaderParam {
  name: string;
  value: string;
  required: boolean;
}

export interface EndpointCardProps {
  method: HttpMethod;
  path: string;
  description: string;
  requestBody?: string;
  responseBody: string;
  responseStatus: number;
  headers?: HeaderParam[];
  pathParams?: PathParam[];
  notes?: string[];
}

const methodStyles: Record<HttpMethod, string> = {
  GET: "bg-green-50 text-green-700 border-green-200",
  POST: "bg-blue-50 text-blue-700 border-blue-200",
  PUT: "bg-amber-50 text-amber-700 border-amber-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
  PATCH: "bg-purple-50 text-purple-700 border-purple-200",
};

export function EndpointCard({
  method,
  path,
  description,
  requestBody,
  responseBody,
  responseStatus,
  headers,
  pathParams,
  notes,
}: EndpointCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 text-left transition-colors hover:bg-slate-50/50"
      >
        <div className={`flex h-7 sm:h-8 min-w-[3.5rem] sm:min-w-[4rem] shrink-0 items-center justify-center rounded-lg border text-[10px] sm:text-xs font-bold font-mono ${methodStyles[method]}`}>
          {method}
        </div>
        <div className="flex-1 min-w-0">
          <code className="font-mono text-xs sm:text-sm text-slate-700 font-semibold truncate block">{path}</code>
          <span className="text-sm text-slate-500 hidden sm:block truncate">{description}</span>
        </div>
        <div className="shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/30 p-4 sm:p-5 space-y-4 sm:space-y-6">
          {/* Mobile: Show full endpoint path and description */}
          <div className="sm:hidden rounded-lg bg-slate-100 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Endpoint</p>
            <code className="font-mono text-xs text-slate-800 font-semibold break-all">{path}</code>
            <p className="text-sm text-slate-600 mt-2">{description}</p>
          </div>

          {pathParams && pathParams.length > 0 && (
            <ParamsTable title="Path Parameters" params={pathParams} />
          )}

          {headers && headers.length > 0 && (
            <HeadersTable headers={headers} />
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {requestBody && (
              <CodeSection title="Request Body" code={requestBody} />
            )}
            <CodeSection title={`Response (${responseStatus})`} code={responseBody} />
          </div>

          {notes && notes.length > 0 && (
            <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-4">
              <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Notes</h4>
              <ul className="space-y-1">
                {notes.map((note, idx) => (
                  <li key={idx} className="text-sm text-amber-900 flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ParamsTable({ title, params }: { title: string; params: PathParam[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{title}</h4>
      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {params.map((param) => (
              <tr key={param.name}>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 bg-slate-50/50 w-32">{param.name}</td>
                <td className="px-4 py-3 text-xs text-blue-600 font-medium w-24">{param.type}</td>
                <td className="px-4 py-3 text-slate-600">{param.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeadersTable({ headers }: { headers: HeaderParam[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Headers</h4>
      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {headers.map((header) => (
              <tr key={header.name}>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 bg-slate-50/50 w-48">{header.name}</td>
                <td className="px-4 py-3 text-xs text-slate-600 font-mono">{header.value}</td>
                <td className="px-4 py-3 text-xs text-right">
                  {header.required ? (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Required</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">Optional</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CodeSection({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</h4>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          {copied ? (
            <><Check className="h-3 w-3" /> Copied</>
          ) : (
            <><Copy className="h-3 w-3" /> Copy</>
          )}
        </button>
      </div>
      <div className="relative group">
        <div className="absolute top-0 left-0 right-0 h-8 bg-slate-900 rounded-t-xl flex items-center px-3 border-b border-slate-800">
           <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-700"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-slate-700"></div>
           </div>
           <div className="mx-auto text-[10px] font-medium text-slate-500 font-mono">json</div>
        </div>
        <pre className="overflow-x-auto rounded-xl bg-slate-950 pt-10 pb-4 px-4 text-xs text-slate-300 font-mono leading-relaxed border border-slate-800 shadow-sm">
          {code}
        </pre>
      </div>
    </div>
  );
}