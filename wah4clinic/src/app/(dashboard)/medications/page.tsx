"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LucidePlus, LucidePill, LucideCalendar } from "lucide-react";

interface Medication {
	id: string;
	code: {
		text?: string;
		coding?: Array<{
			code?: string;
			display?: string;
		}>;
	};
	status: string;
	form?: {
		coding: Array<{
			code?: string;
			display?: string;
		}>;
	};
	identifier?: Array<{
		value?: string;
	}>;
	batch?: {
		lotNumber?: string;
		expirationDate?: string;
	};
}

interface BundleEntry {
	resource: Medication;
}

interface MedicationsBundle {
	total: number;
	entry: BundleEntry[];
}

export default function MedicationsPage() {
	const [medications, setMedications] = useState<Medication[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchMedications();
	}, []);

	const fetchMedications = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/medications");

			if (!response.ok) {
				throw new Error("Failed to fetch medications");
			}

			const bundle: MedicationsBundle = await response.json();
			setMedications(bundle.entry?.map((entry) => entry.resource) || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const getStatusBadgeColor = (status: string) => {
		const colors: Record<string, string> = {
			active: "bg-green-100 text-green-800",
			inactive: "bg-stone-100 text-stone-800",
			"entered-in-error": "bg-red-100 text-red-800",
		};
		return colors[status] || "bg-stone-100 text-stone-800";
	};

	const getDrugDisplay = (medication: Medication) => {
		return (
			medication.code?.text ||
			medication.code?.coding?.[0]?.display ||
			medication.code?.coding?.[0]?.code ||
			"N/A"
		);
	};

	const getFormDisplay = (medication: Medication) => {
		return medication.form?.coding?.[0]?.display || medication.form?.coding?.[0]?.code || "N/A";
	};

	const getBatchDisplay = (medication: Medication) => {
		return medication.batch?.lotNumber || medication.identifier?.[0]?.value || "N/A";
	};

	return (
		<div className="p-4 lg:p-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<div>
					<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">Medications</h1>
					<p className="text-stone-600">
						{loading ? "Loading..." : `${medications.length} medication${medications.length !== 1 ? "s" : ""} in inventory`}
					</p>
				</div>
				<Link
					href="/medications/new"
					className="flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
				>
					<LucidePlus className="w-5 h-5" />
					<span className="hidden sm:inline">New Medication</span>
					<span className="sm:hidden">New</span>
				</Link>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
					<p className="text-red-800 text-sm">{error}</p>
				</div>
			)}

			{loading ? (
				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12">
					<div className="flex items-center justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
					</div>
				</div>
			) : medications.length === 0 ? (
				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12">
					<div className="text-center">
						<div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<LucidePill className="w-8 h-8 text-stone-400" />
						</div>
						<h3 className="text-lg font-medium text-stone-900 mb-2">No medications in inventory yet</h3>
						<p className="text-stone-600 mb-6">Get started by adding your first medication</p>
						<Link
							href="/medications/new"
							className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							<LucidePlus className="w-5 h-5" />
							New Medication
						</Link>
					</div>
				</div>
			) : (
				<>
					{/* Mobile Card View */}
					<div className="lg:hidden space-y-4">
						{medications.map((medication) => (
							<div key={medication.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:shadow-md transition-shadow">
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center gap-2">
										<div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
											<LucidePill className="w-5 h-5 text-amber-600" />
										</div>
										<div>
											<span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(medication.status)}`}>
												{medication.status}
											</span>
										</div>
									</div>
								</div>
								
								<div className="space-y-2 mb-4">
									<div className="text-sm">
										<span className="text-stone-600 font-medium">Drug:</span>
										<span className="text-stone-900 ml-2">{getDrugDisplay(medication)}</span>
									</div>
									<div className="text-sm">
										<span className="text-stone-600 font-medium">Form:</span>
										<span className="text-stone-900 ml-2">{getFormDisplay(medication)}</span>
									</div>
									<div className="text-sm">
										<span className="text-stone-600 font-medium">Batch:</span>
										<span className="text-stone-900 ml-2">{getBatchDisplay(medication)}</span>
									</div>
									{medication.batch?.expirationDate && (
										<div className="flex items-center gap-2 text-sm">
											<LucideCalendar className="w-4 h-4 text-stone-400" />
											<span className="text-stone-900">Exp: {formatDate(medication.batch.expirationDate)}</span>
										</div>
									)}
								</div>
								
								<Link
									href={`/medications/${medication.id}`}
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
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Drug Name</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Form</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Batch</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Expiration</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-stone-100">
									{medications.map((medication) => (
										<tr key={medication.id} className="hover:bg-stone-50 transition-colors">
											<td className="px-6 py-4">
												<span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(medication.status)}`}>
													{medication.status}
												</span>
											</td>
											<td className="px-6 py-4">
												<p className="font-medium text-stone-900">{getDrugDisplay(medication)}</p>
												<p className="text-sm text-stone-500">ID: {medication.id.slice(0, 8)}</p>
											</td>
											<td className="px-6 py-4">
												<p className="text-stone-900">{getFormDisplay(medication)}</p>
											</td>
											<td className="px-6 py-4">
												<p className="text-stone-900">{getBatchDisplay(medication)}</p>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2 text-stone-900">
													<LucideCalendar className="w-4 h-4 text-stone-400" />
													<span className="text-sm">{formatDate(medication.batch?.expirationDate || "")}</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<Link
													href={`/medications/${medication.id}`}
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
