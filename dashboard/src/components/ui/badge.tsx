"use client";

import { clsx } from "clsx";
import { 
  LuClock, 
  LuInbox, 
  LuCircleCheck, 
  LuCircleX,
  LuBuilding2,
  LuStethoscope,
  LuTestTube,
  LuPill,
  LuScan,
  LuCircle
} from "react-icons/lu";

export type BadgeVariant = 
  | "default" 
  | "primary" 
  | "success" 
  | "warning" 
  | "error" 
  | "info";

export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-600 border-slate-200",
  primary: "bg-primary-50 text-primary-700 border-primary-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-slate-400",
  primary: "bg-primary-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-sky-500",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  variant = "default",
  size = "md",
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-semibold rounded-lg border",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={clsx("w-1.5 h-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
}

// Specialized status badge for transactions
export type TransactionStatusType = "PENDING" | "RECEIVED" | "COMPLETED" | "FAILED";

const statusConfig: Record<TransactionStatusType, { 
  variant: BadgeVariant; 
  label: string; 
  icon: React.ComponentType<{ className?: string }>;
}> = {
  PENDING: { variant: "warning", label: "Pending", icon: LuClock },
  RECEIVED: { variant: "info", label: "Received", icon: LuInbox },
  COMPLETED: { variant: "success", label: "Completed", icon: LuCircleCheck },
  FAILED: { variant: "error", label: "Failed", icon: LuCircleX },
};

export interface StatusBadgeProps {
  status: TransactionStatusType;
  size?: BadgeSize;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, size = "md", className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} size={size} className={className}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
}

// Provider type badge
export type ProviderTypeValue = "hospital" | "clinic" | "laboratory" | "pharmacy" | "imaging" | "other";

const providerTypeConfig: Record<ProviderTypeValue, { 
  variant: BadgeVariant; 
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  hospital: { variant: "primary", label: "Hospital", icon: LuBuilding2 },
  clinic: { variant: "success", label: "Clinic", icon: LuStethoscope },
  laboratory: { variant: "info", label: "Laboratory", icon: LuTestTube },
  pharmacy: { variant: "warning", label: "Pharmacy", icon: LuPill },
  imaging: { variant: "default", label: "Imaging", icon: LuScan },
  other: { variant: "default", label: "Other", icon: LuCircle },
};

export interface ProviderTypeBadgeProps {
  type: ProviderTypeValue;
  size?: BadgeSize;
  className?: string;
  showIcon?: boolean;
}

export function ProviderTypeBadge({ type, size = "md", className, showIcon = true }: ProviderTypeBadgeProps) {
  const config = providerTypeConfig[type];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} size={size} className={className}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
}