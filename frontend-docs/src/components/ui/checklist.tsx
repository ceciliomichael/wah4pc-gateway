import { CheckCircle2 } from "lucide-react";

interface ChecklistItemProps {
  text: string;
  checked?: boolean;
}

export function ChecklistItem({ text, checked = false }: ChecklistItemProps) {
  return (
    <li className="flex items-center gap-3">
      <div className="flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-slate-50">
        {checked ? (
          <div className="h-3 w-3 rounded-sm bg-blue-500" />
        ) : (
          <div className="h-2 w-2 rounded-sm bg-slate-300" />
        )}
      </div>
      <span className="text-sm text-slate-700">{text}</span>
    </li>
  );
}

interface PrerequisiteItemProps {
  title: string;
  description: string;
}

export function PrerequisiteItem({ title, description }: PrerequisiteItemProps) {
  return (
    <li className="flex gap-3">
      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
      <div>
        <span className="font-medium text-slate-900">{title}</span>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </li>
  );
}