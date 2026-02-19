"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ObservationForm } from "./observation-form";
import { buildFHIRObservation, fhirToFormData, type ObservationFormData } from "@/lib/observation-utils";

interface ObservationRegistrationFormProps {
	observationId?: string;
}

export function ObservationRegistrationForm({ observationId }: ObservationRegistrationFormProps) {
	const router = useRouter();
	const [formData, setFormData] = useState<ObservationFormData>({
		status: "",
		categoryCode: "",
		categoryDisplay: "",
		code: "",
		codeDisplay: "",
		patientId: "",
		patientDisplay: "",
		encounterId: "",
		effectiveDateTime: "",
		practitionerId: "",
		practitionerDisplay: "",
		valueQuantity: "",
		valueUnit: "",
		systolicValue: "",
		diastolicValue: "",
		interpretation: "",
		interpretationDisplay: "",
		notes: "",
	});
	const [patients, setPatients] = useState<Array<{ code: string; display: string }>>([]);
	const [practitioners, setPractitioners] = useState<Array<{ code: string; display: string }>>([]);
	const [submitting, setSubmitting] = useState(false);
	const [loading, setLoading] = useState(!!observationId);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchPatients();
		fetchPractitioners();
		if (observationId) {
			fetchObservation();
		}
	}, [observationId]);

	const fetchObservation = async () => {
		try {
			const response = await fetch(`/api/observations/${observationId}`);
			if (!response.ok) throw new Error("Failed to fetch observation");

			const observation = await response.json();
			setFormData(fhirToFormData(observation));
		} catch (err) {
			console.error("Error fetching observation:", err);
			setError(err instanceof Error ? err.message : "Failed to load observation");
		} finally {
			setLoading(false);
		}
	};

	const fetchPatients = async () => {
		try {
			const response = await fetch("/api/patients");
			if (!response.ok) throw new Error("Failed to fetch patients");

			const bundle = await response.json();
			const patientList = bundle.entry?.map((entry: { resource: { id: string; name: Array<{ given: string[]; family: string }> } }) => {
				const name = entry.resource.name[0];
				const givenNames = name.given.join(" ");
				return {
					code: entry.resource.id,
					display: `${givenNames} ${name.family}`,
				};
			}) || [];

			setPatients(patientList);
		} catch (err) {
			console.error("Error fetching patients:", err);
		}
	};

	const fetchPractitioners = async () => {
		try {
			const response = await fetch("/api/practitioners");
			if (!response.ok) throw new Error("Failed to fetch practitioners");

			const bundle = await response.json();
			const practitionerList = bundle.entry?.map((entry: { resource: { id: string; name: Array<{ given: string[]; family: string }> } }) => {
				const name = entry.resource.name[0];
				const givenNames = name.given.join(" ");
				return {
					code: entry.resource.id,
					display: `${givenNames} ${name.family}`,
				};
			}) || [];

			setPractitioners(practitionerList);
		} catch (err) {
			console.error("Error fetching practitioners:", err);
		}
	};

	const handleFieldChange = (field: keyof ObservationFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async () => {
		const isBloodPressure = formData.code === "85354-9";
		
		if (!formData.status || !formData.categoryCode || !formData.code || !formData.patientId || !formData.effectiveDateTime) {
			setError("Please fill in all required fields");
			return;
		}

		if (isBloodPressure && (!formData.systolicValue || !formData.diastolicValue)) {
			setError("Please enter both systolic and diastolic blood pressure values");
			return;
		}

		if (!isBloodPressure && !formData.valueQuantity) {
			setError("Please enter an observation value");
			return;
		}

		try {
			setSubmitting(true);
			setError(null);

			const fhirObservation = buildFHIRObservation(formData, patients, practitioners);

			const url = observationId ? `/api/observations/${observationId}` : "/api/observations";
			const method = observationId ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirObservation),
			});

			if (!response.ok) {
				throw new Error(`Failed to ${observationId ? "update" : "create"} observation`);
			}

			const savedObservation = await response.json();
			router.push(`/observations/${savedObservation.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to submit observation");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!observationId) return;

		if (!window.confirm("Are you sure you want to delete this observation record? This action cannot be undone.")) {
			return;
		}

		try {
			setSubmitting(true);
			const response = await fetch(`/api/observations/${observationId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete observation");
			}

			router.push("/observations");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete observation");
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-stone-600">Loading observation data...</p>
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

			<ObservationForm
				formData={formData}
				onFieldChange={handleFieldChange}
				patients={patients}
				practitioners={practitioners}
			/>

			<div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-stone-200">
				<button
					onClick={() => router.push("/observations")}
					disabled={submitting}
					className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-stone-100 text-stone-900 font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Cancel
				</button>
				{observationId && (
					<button
						onClick={handleDelete}
						disabled={submitting}
						className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-tertiary-600 text-white font-medium hover:bg-tertiary-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
					>
						{submitting ? "Deleting..." : "Delete"}
					</button>
				)}
				<button
					onClick={handleSubmit}
					disabled={submitting}
					className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
				>
					{submitting ? (observationId ? "Updating..." : "Creating...") : (observationId ? "Update Observation" : "Create Observation")}
				</button>
			</div>
		</div>
	);
}