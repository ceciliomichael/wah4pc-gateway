import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import type { ReactNode } from "react";

type AlertType = "info" | "warning" | "success" | "error";

interface AlertBlockProps {
  type?: AlertType;
  title?: string;
  children: ReactNode;
  className?: string;
}

const alertStyles: Record<AlertType, { container: string; icon: string; title: string; text: string }> = {
  info: {
    container: "border-blue-200 bg-blue-50",
    icon: "text-blue-600",
    title: "text-blue-900",
    text: "text-blue-800",
  },
  warning: {
    container: "border-amber-200 bg-amber-50",
    icon: "text-amber-600",
    title: "text-amber-900",
    text: "text-amber-800",
  },
  success: {
    container: "border-green-200 bg-green-50",
    icon: "text-green-600",
    title: "text-green-900",
    text: "text-green-800",
  },
  error: {
    container: "border-red-200 bg-red-50",
    icon: "text-red-600",
    title: "text-red-900",
    text: "text-red-800",
  },
};

const alertIcons: Record<AlertType, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

export function AlertBlock({
  type = "info",
  title,
  children,
  className = "",
}: AlertBlockProps) {
  const styles = alertStyles[type];
  const Icon = alertIcons[type];

  return (
    <div className={`rounded-lg border p-4 ${styles.container} ${className}`}>
      {title ? (
        <>
          <h3 className={`font-semibold mb-2 ${styles.title}`}>{title}</h3>
          <div className={`text-sm ${styles.text}`}>{children}</div>
        </>
      ) : (
        <div className="flex gap-2">
          <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${styles.icon}`} />
          <div className={`text-sm ${styles.text}`}>{children}</div>
        </div>
      )}
    </div>
  );
}