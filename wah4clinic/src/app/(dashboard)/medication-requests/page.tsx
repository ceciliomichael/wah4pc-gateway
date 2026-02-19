"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LucidePlus, LucidePill, LucideCalendar } from "lucide-react";

interface MedicationRequestResource {
	id: string;
	status: string;
	intent: string;
	medicationCodeableConcept?: {
		text?: string;
		coding?: Array<{ display?: string }>;
	};
	subject?: {
		display?: string;
	};
	authoredOn?: string;
}

interface BundleEntry {
	resource: MedicationRequestResource;
}

interface MedicationRequestBundle {
	total: number;
	entry: BundleEntry[];
}

export default function MedicationRequestsPage() {
	const [items, setItems] = useState<MedicationRequestResource[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchMedicationRequests();
	}, []);

	const fetchMedicationRequests = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/medication-requests");
			if (!response.ok) {
				throw new Error("Failed to fetch medication requests");
			}
			const bundle: MedicationRequestBundle = await response.json();
			setItems(bundle.entry?.map((entry) => entry.resource) || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const getMedicationName = (resource: MedicationRequestResource): string => {
		return (
			resource.medicationCodeableConcept?.text ||
			resource.medicationCodeableConcept?.coding?.[0]?.display ||
			"N/A"
		);
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
						Medication Requests
					</h1>
					<p className="text-stone-600">
						{loading ? "Loading..." : `${items.length} medication request${items.length !== 1 ? "s" : ""}`}
					</p>
				</div>
				<Link
					href="/medication-requests/new"
					className="flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-all whitespace-nowrap"
				>
					<LucidePlus className="w-5 h-5" />
					New Medication Request
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
						<LucidePill className="w-8 h-8 text-stone-400" />
					</div>
					<h3 className="text-lg font-medium text-stone-900 mb-2">
						No medication requests yet
					</h3>
					<p className="text-stone-600 mb-6">Create your first medication request.</p>
					<Link
						href="/medication-requests/new"
						className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
					>
						<LucidePlus className="w-5 h-5" />
						New Medication Request
					</Link>
				</div>
			) : (
				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-stone-50 border-b border-stone-200">
								<tr>
									<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Status</th>
									<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Intent</th>
									<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Medication</th>
									<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Patient</th>
									<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Authored</th>
									<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
								{items.map((item) => (
									<tr key={item.id} className="hover:bg-stone-50 transition-colors">
										<td className="px-6 py-4 text-sm text-stone-900">{item.status}</td>
										<td className="px-6 py-4 text-sm text-stone-900">{item.intent}</td>
										<td className="px-6 py-4 text-sm text-stone-900">{getMedicationName(item)}</td>
										<td className="px-6 py-4 text-sm text-stone-900">{item.subject?.display || "N/A"}</td>
										<td className="px-6 py-4 text-sm text-stone-900">
											<div className="flex items-center gap-2">
												<LucideCalendar className="w-4 h-4 text-stone-400" />
												<span>{formatDateTime(item.authoredOn)}</span>
											</div>
										</td>
										<td className="px-6 py-4">
											<Link
												href={`/medication-requests/${item.id}`}
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
