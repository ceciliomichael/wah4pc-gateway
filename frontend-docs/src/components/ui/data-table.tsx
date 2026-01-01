import type { ReactNode } from "react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  className = "",
}: DataTableProps<T>) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col, colIdx) => (
              <th
                key={String(col.key)}
                className={`py-3 px-4 ${colIdx === 0 ? "pl-5" : ""} font-semibold text-slate-900 ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
              {columns.map((col, colIdx) => (
                <td
                  key={String(col.key)}
                  className={`py-3 px-4 ${colIdx === 0 ? "pl-5" : ""} ${col.className || ""}`}
                >
                  {col.render
                    ? col.render(row[col.key as keyof T], row)
                    : String(row[col.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ErrorRowData {
  code: number;
  meaning: string;
  causes: string;
  [key: string]: unknown;
}

export function ErrorTable({ data }: { data: ErrorRowData[] }) {
  return (
    <DataTable<ErrorRowData>
      columns={[
        {
          key: "code",
          header: "Status Code",
          className: "w-28",
          render: (value) => (
            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
              {String(value)}
            </span>
          ),
        },
        {
          key: "meaning",
          header: "Meaning",
          className: "w-40 text-slate-900",
        },
        {
          key: "causes",
          header: "Common Causes",
          className: "text-slate-600",
        },
      ]}
      data={data}
    />
  );
}