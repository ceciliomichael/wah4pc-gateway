"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const hasError = !!error;
    const isRequired = !!props.required;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
            {isRequired && (
              <span className="ml-1 text-red-600" aria-hidden="true">
                **
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={clsx(
              "w-full px-4 py-2.5 border rounded-lg text-slate-800 placeholder:text-slate-400",
              "transition-colors",
              "hover:border-slate-300",
              "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              hasError
                ? "border-red-300 focus:border-red-500"
                : "border-slate-200 focus:border-blue-500",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {hint && !error && (
          <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
