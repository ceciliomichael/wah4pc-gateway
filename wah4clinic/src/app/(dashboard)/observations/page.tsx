"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LucidePlus, LucideActivity, LucideCalendar } from "lucide-react";

interface Observation {
	id: string;
	status: string;
	code: {
		text: string;
	};
	subject: {
		display: string;
	};
	effectiveDateTime: string;
	valueQuantity?: {
		value: number;
		unit: string;
	};
	component?: Array<{
		code: {
			coding: Array<{
				code: string;
			}>;
		};
		valueQuantity: {
			value: number;
			unit: string;
		};
	}>;
}

interface BundleEntry {
	resource: Observation;
}

interface ObservationsBundle {
	total: number;
	entry: BundleEntry[];
}

export default function ObservationsPage() {
	const [observations, setObservations] = useState<Observation[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchObservations();
	}, []);

	const fetchObservations = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/observations");

			if (!response.ok) {
				throw new Error("Failed to fetch observations");
			}

			const bundle: ObservationsBundle = await response.json();
			setObservations(bundle.entry?.map((entry) => entry.resource) || []);
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

	const formatValue = (observation: Observation) => {
		// Handle Blood Pressure (component-based)
		if (observation.component && observation.component.length > 0) {
			const systolic = observation.component.find(
				(c) => c.code?.coding?.[0]?.code === "8480-6"
			);
			const diastolic = observation.component.find(
				(c) => c.code?.coding?.[0]?.code === "8462-4"
			);
			
			if (systolic && diastolic) {
				return `${systolic.valueQuantity.value}/${diastolic.valueQuantity.value} ${systolic.valueQuantity.unit}`;
			}
		}
		
		// Handle simple valueQuantity
		if (observation.valueQuantity) {
			return `${observation.valueQuantity.value} ${observation.valueQuantity.unit}`;
		}
		
		return "N/A";
	};

	const getStatusBadgeColor = (status: string) => {
		const colors: Record<string, string> = {
			final: "bg-secondary-100 text-secondary-800",
			preliminary: "bg-secondary-100 text-secondary-800",
			registered: "bg-stone-100 text-stone-800",
			amended: "bg-tertiary-100 text-tertiary-800",
			corrected: "bg-amber-100 text-amber-800",
			cancelled: "bg-tertiary-100 text-tertiary-800",
			"entered-in-error": "bg-tertiary-100 text-tertiary-800",
		};
		return colors[status] || "bg-stone-100 text-stone-800";
	};

	return (
		<div className="p-4 lg:p-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<div>
					<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">Observations</h1>
					<p className="text-stone-600">
						{loading ? "Loading..." : `${observations.length} observation${observations.length !== 1 ? "s" : ""} recorded`}
					</p>
				</div>
				<Link
					href="/observations/new"
					className="flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
				>
					<LucidePlus className="w-5 h-5" />
					<span className="hidden sm:inline">New Observation</span>
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
			) : observations.length === 0 ? (
				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12">
					<div className="text-center">
						<div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<LucideActivity className="w-8 h-8 text-stone-400" />
						</div>
						<h3 className="text-lg font-medium text-stone-900 mb-2">No observations recorded yet</h3>
						<p className="text-stone-600 mb-6">Get started by adding your first observation</p>
						<Link
							href="/observations/new"
							className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							<LucidePlus className="w-5 h-5" />
							New Observation
						</Link>
					</div>
				</div>
			) : (
				<>
					{/* Mobile Card View */}
					<div className="lg:hidden space-y-4">
						{observations.map((observation) => (
							<div key={observation.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:shadow-md transition-shadow">
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center gap-2">
										<div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
											<LucideActivity className="w-5 h-5 text-secondary-600" />
										</div>
										<div>
											<span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(observation.status)}`}>
												{observation.status}
											</span>
										</div>
									</div>
								</div>
								
								<div className="space-y-2 mb-4">
									<div className="text-sm">
										<span className="text-stone-600 font-medium">Type:</span>
										<span className="text-stone-900 ml-2">{observation.code?.text || "N/A"}</span>
									</div>
									<div className="text-sm">
										<span className="text-stone-600 font-medium">Value:</span>
										<span className="text-stone-900 ml-2">{formatValue(observation)}</span>
									</div>
									<div className="text-sm">
										<span className="text-stone-600 font-medium">Patient:</span>
										<span className="text-stone-900 ml-2">{observation.subject?.display || "N/A"}</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										<LucideCalendar className="w-4 h-4 text-stone-400" />
										<span className="text-stone-900">{formatDateTime(observation.effectiveDateTime)}</span>
									</div>
								</div>
								
								<Link
									href={`/observations/${observation.id}`}
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
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Type</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Value</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Patient</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Date Recorded</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-stone-100">
									{observations.map((observation) => (
										<tr key={observation.id} className="hover:bg-stone-50 transition-colors">
											<td className="px-6 py-4">
												<span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(observation.status)}`}>
													{observation.status}
												</span>
											</td>
											<td className="px-6 py-4">
												<p className="font-medium text-stone-900">{observation.code?.text || "N/A"}</p>
												<p className="text-sm text-stone-500">ID: {observation.id.slice(0, 8)}</p>
											</td>
											<td className="px-6 py-4">
												<p className="text-stone-900 font-medium">{formatValue(observation)}</p>
											</td>
											<td className="px-6 py-4">
												<p className="text-stone-900">{observation.subject?.display || "N/A"}</p>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2 text-stone-900">
													<LucideCalendar className="w-4 h-4 text-stone-400" />
													<span className="text-sm">{formatDateTime(observation.effectiveDateTime)}</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<Link
													href={`/observations/${observation.id}`}
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