"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProcedureForm } from "./procedure-form";
import { buildFHIRProcedure, type ProcedureFormData } from "@/lib/procedure-utils";

export function ProcedureRegistrationForm() {
	const router = useRouter();
	const [formData, setFormData] = useState<ProcedureFormData>({
		status: "",
		category: "",
		categoryDisplay: "",
		code: "",
		codeDisplay: "",
		patientId: "",
		patientDisplay: "",
		encounterId: "",
		performedDateTime: "",
		practitionerId: "",
		practitionerDisplay: "",
		location: "",
		reasonCode: "",
		outcome: "",
		notes: "",
	});
	const [patients, setPatients] = useState<Array<{ code: string; display: string }>>([]);
	const [practitioners, setPractitioners] = useState<Array<{ code: string; display: string }>>([]);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchPatients();
		fetchPractitioners();
	}, []);

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

	const handleFieldChange = (field: keyof ProcedureFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async () => {
		if (!formData.status || !formData.code || !formData.patientId || !formData.performedDateTime) {
			setError("Please fill in all required fields");
			return;
		}

		try {
			setSubmitting(true);
			setError(null);

			const fhirProcedure = buildFHIRProcedure(formData, patients, practitioners);

			const response = await fetch("/api/procedures", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirProcedure),
			});

			if (!response.ok) {
				throw new Error("Failed to create procedure");
			}

			const createdProcedure = await response.json();
			router.push(`/procedures/${createdProcedure.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to submit procedure");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			{error && (
				<div className="bg-tertiary-50 border border-tertiary-200 rounded-xl p-4">
					<p className="text-tertiary-800 text-sm">{error}</p>
				</div>
			)}

			<ProcedureForm
				formData={formData}
				onFieldChange={handleFieldChange}
				patients={patients}
				practitioners={practitioners}
			/>

			<div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-stone-200">
				<button
					onClick={() => router.push("/procedures")}
					disabled={submitting}
					className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-stone-100 text-stone-900 font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Cancel
				</button>
				<button
					onClick={handleSubmit}
					disabled={submitting}
					className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
				>
					{submitting ? "Creating..." : "Create Procedure"}
				</button>
			</div>
		</div>
	);
}