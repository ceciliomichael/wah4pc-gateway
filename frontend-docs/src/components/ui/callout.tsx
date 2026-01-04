import { Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";

interface CalloutProps {
  type: "note" | "important" | "critical" | "success";
  children: React.ReactNode;
}

const styles = {
  note: "border-slate-200 bg-slate-50/80 text-slate-700",
  important: "border-blue-200 bg-blue-50/80 text-blue-800",
  critical: "border-orange-200 bg-orange-50/80 text-orange-800",
  success: "border-green-200 bg-green-50/80 text-green-800",
};

const icons = {
  note: <Lightbulb className="h-5 w-5" />,
  important: <AlertTriangle className="h-5 w-5" />,
  critical: <AlertTriangle className="h-5 w-5" />,
  success: <CheckCircle2 className="h-5 w-5" />,
};

export function Callout({ type, children }: CalloutProps) {
  return (
    <div className={`mt-6 flex items-start gap-3 rounded-xl border p-4 text-sm shadow-sm ${styles[type]}`}>
      <span className="mt-0.5 shrink-0">{icons[type]}</span>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}