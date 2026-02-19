"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LucidePlus, LucideFileText, LucideCalendar } from "lucide-react";

interface DiagnosticReportResource {
	id: string;
	status: string;
	code?: {
		text?: string;
		coding?: Array<{ display?: string }>;
	};
	subject?: {
		display?: string;
	};
	issued?: string;
	conclusion?: string;
}

interface BundleEntry {
	resource: DiagnosticReportResource;
}

interface DiagnosticReportBundle {
	total: number;
	entry: BundleEntry[];
}

export default function DiagnosticReportsPage() {
	const [items, setItems] = useState<DiagnosticReportResource[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchDiagnosticReports();
	}, []);

	const fetchDiagnosticReports = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/diagnostic-reports");
			if (!response.ok) {
				throw new Error("Failed to fetch diagnostic reports");
			}
			const bundle: DiagnosticReportBundle = await response.json();
			setItems(bundle.entry?.map((entry) => entry.resource) || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const getCodeDisplay = (resource: DiagnosticReportResource): string => {
		return resource.code?.text || resource.code?.coding?.[0]?.display || "N/A";
	};

	const formatDateTime = (value?: string): string => {
		if (!value) {
			return "N/A";
		}
		return new Date(value).toLocaleString();
	};

	return (
		<div className="p-4 lg:p-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<div>
					<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">
						Diagnostic Reports
					</h1>
					<p className="text-stone-600">
						{loading ? "Loading..." : `${items.length} diagnostic report${items.length !== 1 ? "s" : ""}`}
					</p>
				</div>
				<Link
					href="/diagnostic-reports/new"
					className="flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-all whitespace-nowrap"
				>
					<LucidePlus className="w-5 h-5" />
					New Diagnostic Report
				</Link>
			</div>

			{error && (
				<div className="bg-tertiary-50 border border-tertiary-200 rounded-xl p-4 mb-6">
					<p className="text-tertiary-800 text-sm">{error}</p>
				</div>
			)}

			{loading ? (
				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12">
					<div className="flex items-center justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
					</div>
				</div>
			) : items.length === 0 ? (
				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12 text-center">
					<div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<LucideFileText className="w-8 h-8 text-stone-400" />
					</div>
					<h3 className="text-lg font-medium text-stone-900 mb-2">
						No diagnostic reports yet
					</h3>
					<p className="text-stone-600 mb-6">
						Create your first diagnostic report.
					</p>
					<Link
						href="/diagnostic-reports/new"
						className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
					>
						<LucidePlus className="w-5 h-5" />
						New Diagnostic Report
					</Link>
				</div>
			) : (
				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-stone-50 border-b border-stone-200">
								<tr>
									<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Status</th>
									<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Code</th>
									<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Patient</th>
									<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Issued</th>
									<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Conclusion</th>
									<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
								{items.map((item) => (
									<tr key={item.id} className="hover:bg-stone-50 transition-colors">
										<td className="px-6 py-4 text-sm text-stone-900">{item.status}</td>
										<td className="px-6 py-4 text-sm text-stone-900">{getCodeDisplay(item)}</td>
										<td className="px-6 py-4 text-sm text-stone-900">{item.subject?.display || "N/A"}</td>
										<td className="px-6 py-4 text-sm text-stone-900">
											<div className="flex items-center gap-2">
												<LucideCalendar className="w-4 h-4 text-stone-400" />
												<span>{formatDateTime(item.issued)}</span>
											</div>
										</td>
										<td className="px-6 py-4 text-sm text-stone-900">{item.conclusion || "N/A"}</td>
										<td className="px-6 py-4">
											<Link
												href={`/diagnostic-reports/${item.id}`}
												className="inline-block px-4 py-2 rounded-lg bg-stone-100 text-stone-900 text-sm font-medium hover:bg-stone-200 transition-colors"
											>
												View Details
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
