"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImmunizationForm } from "./immunization-form";
import { buildFHIRImmunization, fhirToFormData, type ImmunizationFormData } from "@/lib/immunization-utils";

interface ImmunizationRegistrationFormProps {
	immunizationId?: string;
}

export function ImmunizationRegistrationForm({ immunizationId }: ImmunizationRegistrationFormProps) {
	const router = useRouter();
	const [formData, setFormData] = useState<ImmunizationFormData>({
		status: "",
		vaccineCode: "",
		vaccineDisplay: "",
		patientId: "",
		patientDisplay: "",
		encounterId: "",
		occurrenceDateTime: "",
		practitionerId: "",
		practitionerDisplay: "",
		site: "",
		siteDisplay: "",
		route: "",
		routeDisplay: "",
		doseValue: "",
		doseUnit: "",
		lotNumber: "",
		expirationDate: "",
		manufacturer: "",
		location: "",
		notes: "",
	});
	const [patients, setPatients] = useState<Array<{ code: string; display: string }>>([]);
	const [practitioners, setPractitioners] = useState<Array<{ code: string; display: string }>>([]);
	const [submitting, setSubmitting] = useState(false);
	const [loading, setLoading] = useState(!!immunizationId);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchPatients();
		fetchPractitioners();
		if (immunizationId) {
			fetchImmunization();
		}
	}, [immunizationId]);

	const fetchImmunization = async () => {
		try {
			const response = await fetch(`/api/immunizations/${immunizationId}`);
			if (!response.ok) throw new Error("Failed to fetch immunization");

			const immunization = await response.json();
			setFormData(fhirToFormData(immunization));
		} catch (err) {
			console.error("Error fetching immunization:", err);
			setError(err instanceof Error ? err.message : "Failed to load immunization");
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

	const handleFieldChange = (field: keyof ImmunizationFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async () => {
		if (!formData.status || !formData.vaccineCode || !formData.patientId || !formData.occurrenceDateTime) {
			setError("Please fill in all required fields");
			return;
		}

		try {
			setSubmitting(true);
			setError(null);

			const fhirImmunization = buildFHIRImmunization(formData, patients, practitioners);

			const url = immunizationId ? `/api/immunizations/${immunizationId}` : "/api/immunizations";
			const method = immunizationId ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirImmunization),
			});

			if (!response.ok) {
				throw new Error(`Failed to ${immunizationId ? "update" : "create"} immunization`);
			}

			const savedImmunization = await response.json();
			router.push(`/immunizations/${savedImmunization.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to submit immunization");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!immunizationId) return;

		if (!window.confirm("Are you sure you want to delete this immunization record? This action cannot be undone.")) {
			return;
		}

		try {
			setSubmitting(true);
			const response = await fetch(`/api/immunizations/${immunizationId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete immunization");
			}

			router.push("/immunizations");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete immunization");
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-stone-600">Loading immunization data...</p>
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

			<ImmunizationForm
				formData={formData}
				onFieldChange={handleFieldChange}
				patients={patients}
				practitioners={practitioners}
			/>

			<div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-stone-200">
				<button
					onClick={() => router.push("/immunizations")}
					disabled={submitting}
					className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-stone-100 text-stone-900 font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Cancel
				</button>
				{immunizationId && (
					<button
						onClick={handleDelete}
						disabled={submitting}
						className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
					>
						{submitting ? "Deleting..." : "Delete"}
					</button>
				)}
				<button
					onClick={handleSubmit}
					disabled={submitting}
					className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
				>
					{submitting ? (immunizationId ? "Updating..." : "Creating...") : (immunizationId ? "Update Immunization" : "Create Immunization")}
				</button>
			</div>
		</div>
	);
}