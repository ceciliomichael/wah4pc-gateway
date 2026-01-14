"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { JsonViewer } from "@/components/ui/json-viewer";
import { MethodBadge } from "@/components/ui/method-badge";

interface WebhookStep {
  num: string;
  color: string;
  text: React.ReactNode;
}

interface HttpRequestMeta {
  method: string;
  url: string;
  headers: Record<string, string>;
}

interface WebhookCardProps {
  icon: React.ReactNode;
  iconBg: string;
  borderColor: string;
  bgColor: string;
  title: string;
  subtitle: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  requestCode: string;
  requestTitle: string;
  steps: WebhookStep[];
  responseCode: string;
  responseTitle: string;
  /** Optional: If the response is an HTTP request to be made (not just JSON) */
  responseHttpMeta?: HttpRequestMeta;
  className?: string;
}

export function WebhookCard({
  icon,
  iconBg,
  borderColor,
  bgColor,
  title,
  subtitle,
  method,
  endpoint,
  requestCode,
  requestTitle,
  steps,
  responseCode,
  responseTitle,
  responseHttpMeta,
  className = "",
}: WebhookCardProps) {
  return (
    <div className={`rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-md ${className}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} shadow-sm`}>{icon}</div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3 bg-white/50 p-3 rounded-lg border border-slate-200/50">
        <MethodBadge method={method} className="" />
        <code className="text-sm font-mono text-slate-700 font-medium">{endpoint}</code>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
           <JsonViewer title={requestTitle} data={requestCode} />
           
           <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Implementation Requirements</h4>
            <ol className="space-y-3 text-sm text-slate-600">
              {steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className={`font-mono font-bold ${step.color}`}>{step.num}</span>
                  <div className="leading-relaxed">{step.text}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div>
          {responseHttpMeta ? (
            <HttpRequestViewer 
              title={responseTitle} 
              meta={responseHttpMeta} 
              body={responseCode} 
            />
          ) : (
            <JsonViewer title={responseTitle} data={responseCode} />
          )}
        </div>
      </div>
    </div>
  );
}

// Component to display HTTP request with headers + JSON body
function HttpRequestViewer({ 
  title, 
  meta, 
  body 
}: { 
  title: string; 
  meta: HttpRequestMeta; 
  body: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const fullText = `${meta.method} ${meta.url}\nHeaders:\n${Object.entries(meta.headers)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n')}\n\nBody:\n${body}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          {title}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          {copied ? (
            <><Check className="h-3 w-3 text-green-600" /> <span className="text-green-600">Copied</span></>
          ) : (
            <><Copy className="h-3 w-3" /> Copy</>
          )}
        </button>
      </div>
      
      <div className="p-4 text-xs font-mono leading-relaxed">
        {/* HTTP Method & URL */}
        <div className="mb-3">
          <span className="text-purple-600 font-semibold">{meta.method}</span>
          <span className="text-slate-600 ml-2">{meta.url}</span>
        </div>
        
        {/* Headers */}
        <div className="mb-3 text-slate-500">
          <div className="text-slate-400 mb-1">Headers:</div>
          {Object.entries(meta.headers).map(([key, value]) => (
            <div key={key} className="ml-2">
              <span className="text-blue-600">{key}:</span>
              <span className="text-green-600 ml-1">{value}</span>
            </div>
          ))}
        </div>
        
        {/* Body label */}
        <div className="text-slate-400 mb-2">Body:</div>
        
        {/* JSON Body */}
        <div className="border-t border-slate-100 pt-2">
          <JsonViewer data={body} initialExpanded={true} />
        </div>
      </div>
    </div>
  );
}

export type { WebhookCardProps, WebhookStep, HttpRequestMeta };