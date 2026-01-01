import { JsonViewer } from "@/components/ui/json-viewer";
import { MethodBadge } from "@/components/ui/method-badge";

interface WebhookStep {
  num: string;
  color: string;
  text: React.ReactNode;
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
           <JsonViewer title={responseTitle} data={responseCode} />
        </div>
      </div>
    </div>
  );
}

export type { WebhookCardProps, WebhookStep };