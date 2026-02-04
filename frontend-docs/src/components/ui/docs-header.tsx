import { CopyPageButton } from "./copy-page-button";

interface DocsHeaderProps {
  badge: string;
  badgeColor?: "blue" | "green" | "orange" | "purple";
  title: string;
  description: string;
  action?: React.ReactNode;
}

const badgeStyles = {
  blue: "border-blue-200 bg-blue-50/50 text-blue-700",
  green: "border-green-200 bg-green-50/50 text-green-700",
  orange: "border-orange-200 bg-orange-50/50 text-orange-700",
  purple: "border-purple-200 bg-purple-50/50 text-purple-700",
};

const dotColors = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  orange: "bg-orange-600",
  purple: "bg-purple-600",
};

export function DocsHeader({
  badge,
  badgeColor = "blue",
  title,
  description,
  action,
}: DocsHeaderProps) {
  return (
    <header className="mb-8 sm:mb-12 border-b border-slate-100 pb-6 sm:pb-8">
      <div className="mb-4 sm:mb-6 flex flex-row items-center justify-between gap-2 sm:gap-4">
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs sm:text-sm font-medium shadow-sm transition-colors ${badgeStyles[badgeColor]}`}
        >
          <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${dotColors[badgeColor]}`} />
          {badge}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            {action}
          </div>
          <CopyPageButton pageTitle={title} />
        </div>
      </div>
      <h1 className="mb-3 sm:mb-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="max-w-3xl text-lg sm:text-xl leading-relaxed text-slate-600">{description}</p>
    </header>
  );
}