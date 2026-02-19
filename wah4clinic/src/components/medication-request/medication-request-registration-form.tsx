"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MedicationRequestForm } from "./medication-request-form";
import {
	buildFHIRMedicationRequest,
	fhirToFormData,
	type MedicationRequestFormData,
} from "@/lib/medication-request-utils";

interface MedicationRequestRegistrationFormProps {
	medicationRequestId?: string;
}

export function MedicationRequestRegistrationForm({
	medicationRequestId,
}: MedicationRequestRegistrationFormProps) {
	const router = useRouter();
	const [formData, setFormData] = useState<MedicationRequestFormData>({
		status: "",
		intent: "",
		priority: "",
		medicationCode: "",
		medicationDisplay: "",
		patientId: "",
		patientDisplay: "",
		encounterId: "",
		authoredOn: "",
		requesterId: "",
		requesterDisplay: "",
		dosageInstruction: "",
		dispenseQuantity: "",
		notes: "",
	});
	const [patients, setPatients] = useState<Array<{ code: string; display: string }>>([]);
	const [practitioners, setPractitioners] = useState<
		Array<{ code: string; display: string }>
	>([]);
	const [submitting, setSubmitting] = useState(false);
	const [loading, setLoading] = useState(!!medicationRequestId);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchPatients();
		fetchPractitioners();
		if (medicationRequestId) {
			fetchMedicationRequest();
		}
	}, [medicationRequestId]);

	const fetchMedicationRequest = async () => {
		try {
			const response = await fetch(`/api/medication-requests/${medicationRequestId}`);
			if (!response.ok) {
				throw new Error("Failed to fetch medication request");
			}

			const resource = await response.json();
			setFormData(fhirToFormData(resource));
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load medication request",
			);
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
		field: keyof MedicationRequestFormData,
		value: string,
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async () => {
		if (
			!formData.status ||
			!formData.intent ||
			!formData.medicationCode ||
			!formData.medicationDisplay ||
			!formData.patientId
		) {
			setError("Please fill in all required fields");
			return;
		}

		try {
			setSubmitting(true);
			setError(null);

			const payload = buildFHIRMedicationRequest(
				formData,
				patients,
				practitioners,
			);
			const endpoint = medicationRequestId
				? `/api/medication-requests/${medicationRequestId}`
				: "/api/medication-requests";
			const method = medicationRequestId ? "PUT" : "POST";

			const response = await fetch(endpoint, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(
					`Failed to ${medicationRequestId ? "update" : "create"} medication request`,
				);
			}

			const saved = await response.json();
			router.push(`/medication-requests/${saved.id}`);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to submit medication request",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!medicationRequestId) {
			return;
		}
		if (!window.confirm("Delete this medication request?")) {
			return;
		}

		try {
			setSubmitting(true);
			const response = await fetch(
				`/api/medication-requests/${medicationRequestId}`,
				{
					method: "DELETE",
				},
			);
			if (!response.ok) {
				throw new Error("Failed to delete medication request");
			}
			router.push("/medication-requests");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to delete medication request",
			);
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-stone-600">Loading medication request data...</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{error && (
				<div className="bg-tertiary-50 border border-tertiary-200 rounded-xl p-4">
					<p className="text-tertiary-800 text-sm">{error}</p>
				</div>
			)}

			<MedicationRequestForm
				formData={formData}
				onFieldChange={handleFieldChange}
				patients={patients}
				practitioners={practitioners}
				disabled={submitting}
			/>

			<div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-stone-200">
				<button
					onClick={() => router.push("/medication-requests")}
					disabled={submitting}
					className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-stone-100 text-stone-900 font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Cancel
				</button>
				{medicationRequestId && (
					<button
						onClick={handleDelete}
						disabled={submitting}
						className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-tertiary-600 text-white font-medium hover:bg-tertiary-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
						? medicationRequestId
							? "Updating..."
							: "Creating..."
						: medicationRequestId
							? "Update Medication Request"
							: "Create Medication Request"}
				</button>
			</div>
		</div>
	);
}
