"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LucidePlus, LucideSyringe, LucideCalendar } from "lucide-react";

interface Immunization {
	id: string;
	status: string;
	vaccineCode: {
		text: string;
	};
	patient: {
		display: string;
	};
	occurrenceDateTime: string;
}

interface BundleEntry {
	resource: Immunization;
}

interface ImmunizationsBundle {
	total: number;
	entry: BundleEntry[];
}

export default function ImmunizationsPage() {
	const [immunizations, setImmunizations] = useState<Immunization[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchImmunizations();
	}, []);

	const fetchImmunizations = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/immunizations");

			if (!response.ok) {
				throw new Error("Failed to fetch immunizations");
			}

			const bundle: ImmunizationsBundle = await response.json();
			setImmunizations(bundle.entry?.map((entry) => entry.resource) || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const formatDateTime = (dateString: string) => {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusBadgeColor = (status: string) => {
		const colors: Record<string, string> = {
			completed: "bg-secondary-100 text-secondary-800",
			"entered-in-error": "bg-tertiary-100 text-tertiary-800",
			"not-done": "bg-stone-100 text-stone-800",
		};
		return colors[status] || "bg-stone-100 text-stone-800";
	};

	return (
		<div className="p-4 lg:p-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<div>
					<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">Immunizations</h1>
					<p className="text-stone-600">
						{loading ? "Loading..." : `${immunizations.length} immunization${immunizations.length !== 1 ? "s" : ""} recorded`}
					</p>
				</div>
				<Link
					href="/immunizations/new"
					className="flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
				>
					<LucidePlus className="w-5 h-5" />
					<span className="hidden sm:inline">New Immunization</span>
					<span className="sm:hidden">New</span>
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
			) : immunizations.length === 0 ? (
				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12">
					<div className="text-center">
						<div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<LucideSyringe className="w-8 h-8 text-stone-400" />
						</div>
						<h3 className="text-lg font-medium text-stone-900 mb-2">No immunizations recorded yet</h3>
						<p className="text-stone-600 mb-6">Get started by adding your first immunization</p>
						<Link
							href="/immunizations/new"
							className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							<LucidePlus className="w-5 h-5" />
							New Immunization
						</Link>
					</div>
				</div>
			) : (
				<>
					{/* Mobile Card View */}
					<div className="lg:hidden space-y-4">
						{immunizations.map((immunization) => (
							<div key={immunization.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:shadow-md transition-shadow">
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center gap-2">
										<div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
											<LucideSyringe className="w-5 h-5 text-secondary-600" />
										</div>
										<div>
											<span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(immunization.status)}`}>
												{immunization.status}
											</span>
										</div>
									</div>
								</div>
								
								<div className="space-y-2 mb-4">
									<div className="text-sm">
										<span className="text-stone-600 font-medium">Vaccine:</span>
										<span className="text-stone-900 ml-2">{immunization.vaccineCode?.text || "N/A"}</span>
									</div>
									<div className="text-sm">
										<span className="text-stone-600 font-medium">Patient:</span>
										<span className="text-stone-900 ml-2">{immunization.patient?.display || "N/A"}</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										<LucideCalendar className="w-4 h-4 text-stone-400" />
										<span className="text-stone-900">{formatDateTime(immunization.occurrenceDateTime)}</span>
									</div>
								</div>
								
								<Link
									href={`/immunizations/${immunization.id}`}
									className="block w-full text-center px-4 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
								>
									View Details
								</Link>
							</div>
						))}
					</div>

					{/* Desktop Table View */}
					<div className="hidden lg:block bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-stone-50 border-b border-stone-200">
									<tr>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Status</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Vaccine</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Patient</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Date Administered</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-stone-100">
									{immunizations.map((immunization) => (
										<tr key={immunization.id} className="hover:bg-stone-50 transition-colors">
											<td className="px-6 py-4">
												<span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(immunization.status)}`}>
													{immunization.status}
												</span>
											</td>
											<td className="px-6 py-4">
												<p className="font-medium text-stone-900">{immunization.vaccineCode?.text || "N/A"}</p>
												<p className="text-sm text-stone-500">ID: {immunization.id.slice(0, 8)}</p>
											</td>
											<td className="px-6 py-4">
												<p className="text-stone-900">{immunization.patient?.display || "N/A"}</p>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2 text-stone-900">
													<LucideCalendar className="w-4 h-4 text-stone-400" />
													<span className="text-sm">{formatDateTime(immunization.occurrenceDateTime)}</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<Link
													href={`/immunizations/${immunization.id}`}
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
				</>
			)}
		</div>
	);
}