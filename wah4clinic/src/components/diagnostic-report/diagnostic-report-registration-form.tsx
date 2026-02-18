"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DiagnosticReportForm } from "./diagnostic-report-form";
import {
	buildFHIRDiagnosticReport,
	fhirToFormData,
	type DiagnosticReportFormData,
} from "@/lib/diagnostic-report-utils";

interface DiagnosticReportRegistrationFormProps {
	diagnosticReportId?: string;
}

export function DiagnosticReportRegistrationForm({
	diagnosticReportId,
}: DiagnosticReportRegistrationFormProps) {
	const router = useRouter();
	const [formData, setFormData] = useState<DiagnosticReportFormData>({
		status: "",
		categoryCode: "",
		categoryDisplay: "",
		code: "",
		codeDisplay: "",
		patientId: "",
		patientDisplay: "",
		encounterId: "",
		effectiveDateTime: "",
		issuedDateTime: "",
		performerId: "",
		performerDisplay: "",
		resultObservationIds: "",
		conclusion: "",
	});
	const [patients, setPatients] = useState<Array<{ code: string; display: string }>>([]);
	const [practitioners, setPractitioners] = useState<
		Array<{ code: string; display: string }>
	>([]);
	const [submitting, setSubmitting] = useState(false);
	const [loading, setLoading] = useState(!!diagnosticReportId);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchPatients();
		fetchPractitioners();
		if (diagnosticReportId) {
			fetchDiagnosticReport();
		}
	}, [diagnosticReportId]);

	const fetchDiagnosticReport = async () => {
		try {
			const response = await fetch(`/api/diagnostic-reports/${diagnosticReportId}`);
			if (!response.ok) {
				throw new Error("Failed to fetch diagnostic report");
			}
			const diagnosticReport = await response.json();
			setFormData(fhirToFormData(diagnosticReport));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load diagnostic report");
		} finally {
			setLoading(false);
		}
	};

	const fetchPatients = async () => {
		try {
			const response = await fetch("/api/patients");
			if (!response.ok) {
				throw new Error("Failed to fetch patients");
			}
			const bundle = await response.json();
			const patientList =
				bundle.entry?.map(
					(entry: {
						resource: { id: string; name: Array<{ given: string[]; family: string }> };
					}) => {
						const name = entry.resource.name[0];
						return {
							code: entry.resource.id,
							display: `${name.given.join(" ")} ${name.family}`,
						};
					},
				) || [];
			setPatients(patientList);
		} catch (err) {
			console.error("Failed to fetch patients:", err);
		}
	};

	const fetchPractitioners = async () => {
		try {
			const response = await fetch("/api/practitioners");
			if (!response.ok) {
				throw new Error("Failed to fetch practitioners");
			}
			const bundle = await response.json();
			const practitionerList =
				bundle.entry?.map(
					(entry: {
						resource: { id: string; name: Array<{ given: string[]; family: string }> };
					}) => {
						const name = entry.resource.name[0];
						return {
							code: entry.resource.id,
							display: `${name.given.join(" ")} ${name.family}`,
						};
					},
				) || [];
			setPractitioners(practitionerList);
		} catch (err) {
			console.error("Failed to fetch practitioners:", err);
		}
	};

	const handleFieldChange = (
		field: keyof DiagnosticReportFormData,
		value: string,
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async () => {
		if (!formData.status || !formData.code || !formData.codeDisplay) {
			setError("Please fill in all required fields");
			return;
		}

		try {
			setSubmitting(true);
			setError(null);

			const payload = buildFHIRDiagnosticReport(
				formData,
				patients,
				practitioners,
			);

			const endpoint = diagnosticReportId
				? `/api/diagnostic-reports/${diagnosticReportId}`
				: "/api/diagnostic-reports";
			const method = diagnosticReportId ? "PUT" : "POST";

			const response = await fetch(endpoint, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(
					`Failed to ${diagnosticReportId ? "update" : "create"} diagnostic report`,
				);
			}

			const saved = await response.json();
			router.push(`/diagnostic-reports/${saved.id}`);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to submit diagnostic report",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!diagnosticReportId) {
			return;
		}
		if (!window.confirm("Delete this diagnostic report?")) {
			return;
		}

		try {
			setSubmitting(true);
			const response = await fetch(`/api/diagnostic-reports/${diagnosticReportId}`, {
				method: "DELETE",
			});
			if (!response.ok) {
				throw new Error("Failed to delete diagnostic report");
			}
			router.push("/diagnostic-reports");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to delete diagnostic report",
			);
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-stone-600">Loading diagnostic report data...</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-xl p-4">
					<p className="text-red-800 text-sm">{error}</p>
				</div>
			)}

			<DiagnosticReportForm
				formData={formData}
				onFieldChange={handleFieldChange}
				patients={patients}
				practitioners={practitioners}
				disabled={submitting}
			/>

			<div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-stone-200">
				<button
					onClick={() => router.push("/diagnostic-reports")}
					disabled={submitting}
					className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-stone-100 text-stone-900 font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Cancel
				</button>
				{diagnosticReportId && (
					<button
						onClick={handleDelete}
						disabled={submitting}
						className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Delete
					</button>
				)}
				<button
					onClick={handleSubmit}
					disabled={submitting}
					className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{submitting
						? diagnosticReportId
							? "Updating..."
							: "Creating..."
						: diagnosticReportId
							? "Update Diagnostic Report"
							: "Create Diagnostic Report"}
				</button>
			</div>
		</div>
	);
}
