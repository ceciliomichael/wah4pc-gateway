"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { clsx } from "clsx";
import { LuChevronDown } from "react-icons/lu";

// Dropdown Context for compound components
interface DropdownContextValue {
  isOpen: boolean;
  close: () => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown compound components must be used within a Dropdown");
  }
  return context;
}

// Dropdown alignment and position
export type DropdownAlign = "start" | "center" | "end";
export type DropdownPosition = "bottom" | "top";

// Main Dropdown component
export interface DropdownProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  align?: DropdownAlign;
  position?: DropdownPosition;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  closeOnClick?: boolean;
}

export function Dropdown({
  children,
  trigger,
  align = "start",
  position = "bottom",
  className,
  contentClassName,
  disabled = false,
  closeOnClick = true,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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

  // Close on escape key
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

  const alignStyles: Record<DropdownAlign, string> = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  const positionStyles: Record<DropdownPosition, string> = {
    bottom: "top-full mt-1",
    top: "bottom-full mb-1",
  };

  const handleContentClick = () => {
    if (closeOnClick) {
      setIsOpen(false);
    }
  };

  return (
    <DropdownContext.Provider value={{ isOpen, close }}>
      <div ref={dropdownRef} className={clsx("relative inline-block", className)}>
        {/* Trigger */}
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={clsx(disabled && "cursor-not-allowed opacity-50")}
        >
          {trigger}
        </div>

        {/* Content */}
        {isOpen && (
          <div
            className={clsx(
              "absolute z-[200] min-w-48",
              "bg-white rounded-lg border border-slate-200 shadow-lg",
              "animate-in fade-in-0 zoom-in-95 duration-150",
              alignStyles[align],
              positionStyles[position],
              contentClassName
            )}
            onClick={handleContentClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" && closeOnClick) {
                setIsOpen(false);
              }
            }}
          >
            {children}
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  );
}

// Dropdown Menu - for simple menu lists
export interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenu({ children, className }: DropdownMenuProps) {
  return (
    <div className={clsx("py-1", className)} role="menu">
      {children}
    </div>
  );
}

// Dropdown Item - clickable menu item
export interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  disabled = false,
  variant = "default",
  icon,
  className,
}: DropdownItemProps) {
  const { close } = useDropdownContext();

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
      close();
    }
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      className={clsx(
        "flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "default" && "text-slate-700 hover:bg-slate-100",
        variant === "destructive" && "text-red-600 hover:bg-red-50",
        className
      )}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

// Dropdown Separator
export function DropdownSeparator({ className }: { className?: string }) {
  return (
    <div
      className={clsx("h-px bg-slate-200 my-1", className)}
      role="separator"
    />
  );
}

// Dropdown Label - non-interactive label
export interface DropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div
      className={clsx(
        "px-3 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider",
        className
      )}
    >
      {children}
    </div>
  );
}

// Dropdown Content - for fully custom content
export interface DropdownContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownContent({ children, className }: DropdownContentProps) {
  return <div className={clsx("p-3", className)}>{children}</div>;
}

// Pre-styled trigger button
export interface DropdownTriggerButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  showChevron?: boolean;
  className?: string;
}

export function DropdownTriggerButton({
  children,
  variant = "secondary",
  size = "md",
  showChevron = true,
  className,
}: DropdownTriggerButtonProps) {
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
  };

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
  };

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors cursor-pointer",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
      {showChevron && <LuChevronDown className="w-4 h-4" />}
    </div>
  );
}