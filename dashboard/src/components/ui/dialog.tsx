"use client";

import { useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { LuX } from "react-icons/lu";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Dialog({
  open,
  onClose,
  children,
  className,
  size = "md",
}: DialogProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Container */}
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          "relative bg-white rounded-xl shadow-xl w-full",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          sizeStyles[size],
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function DialogHeader({
  children,
  className,
  onClose,
  showCloseButton = true,
}: DialogHeaderProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between px-5 py-4 border-b border-slate-200",
        className
      )}
    >
      <div>{children}</div>
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Close dialog"
        >
          <LuX className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={clsx("font-semibold text-slate-800", className)}>
      {children}
    </h2>
  );
}

export interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p className={clsx("text-sm text-slate-500 mt-1", className)}>
      {children}
    </p>
  );
}

export interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <div className={clsx("px-5 py-4", className)}>
      {children}
    </div>
  );
}

export interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-end gap-3 px-5 py-4 bg-slate-50 border-t border-slate-200",
        className
      )}
    >
      {children}
    </div>
  );
}