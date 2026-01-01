"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { LuChevronDown, LuCheck } from "react-icons/lu";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
}

export function Select({
  value,
  onChange,
  options,
  label,
  hint,
  error,
  placeholder = "Select an option...",
  disabled = false,
  className,
  name,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasError = !!error;

  // Find selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label || placeholder;
  const hasValue = !!selectedOption;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === "ArrowDown" && isOpen) {
      e.preventDefault();
      // Find next non-disabled option
      const currentIndex = options.findIndex((opt) => opt.value === value);
      const nextIndex = options.findIndex(
        (opt, idx) => idx > currentIndex && !opt.disabled
      );
      if (nextIndex !== -1) {
        onChange(options[nextIndex].value);
      }
    } else if (e.key === "ArrowUp" && isOpen) {
      e.preventDefault();
      // Find previous non-disabled option
      const currentIndex = options.findIndex((opt) => opt.value === value);
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (!options[i].disabled) {
          onChange(options[i].value);
          break;
        }
      }
    }
  };

  return (
    <div className={clsx("w-full", className)} ref={containerRef}>
      {/* Hidden native select for form compatibility */}
      {name && (
        <select
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      {/* Custom Select Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={clsx(
            "w-full flex items-center justify-between px-4 py-2.5 border rounded-lg text-left transition-colors",
            "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
            hasError
              ? "border-red-300 focus:border-red-500"
              : isOpen
                ? "border-blue-500"
                : "border-slate-200 hover:border-slate-300",
            hasValue ? "text-slate-800" : "text-slate-400"
          )}
        >
          <span className="truncate">{displayValue}</span>
          <LuChevronDown
            className={clsx(
              "w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ml-2",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <div
            role="listbox"
            className={clsx(
              "absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden",
              "animate-in fade-in-0 zoom-in-95 duration-150"
            )}
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    className={clsx(
                      "w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      isSelected
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <LuCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Hint / Error */}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}