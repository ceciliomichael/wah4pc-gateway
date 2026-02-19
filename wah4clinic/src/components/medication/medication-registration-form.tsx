"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MedicationForm } from "./medication-form";
import { buildFHIRMedication, type MedicationFormData, type Drug } from "@/lib/medication-utils";
import { useCodeSystem } from "@/hooks/use-terminology";

export function MedicationRegistrationForm() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [formData, setFormData] = useState<MedicationFormData>({
		drugCode: "",
		drugDisplay: "",
		status: "",
		manufacturer: "",
		form: "",
		amountValue: "",
		amountUnit: "",
		batchNumber: "",
		expirationDate: "",
	});

	const { data: drugs, loading: drugsLoading } = useCodeSystem("drugs");

	const handleFieldChange = (field: keyof MedicationFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const fhirMedication = buildFHIRMedication(formData, drugs);

			const response = await fetch("/api/medications", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirMedication),
			});

			if (!response.ok) {
				throw new Error("Failed to create medication");
			}

			setShowSuccessDialog(true);
		} catch (error) {
			console.error("Error creating medication:", error);
			alert("Failed to create medication. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDialogClose = () => {
		setShowSuccessDialog(false);
		router.push("/medications");
	};

	return (
		<>
			<form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-stone-100 shadow-sm p-8">
				<div className="mb-8">
					<h2 className="text-2xl font-semibold text-stone-900 mb-2">New Medication</h2>
					<p className="text-sm text-stone-600">Please fill out all required fields marked with *</p>
				</div>

				<MedicationForm
					formData={formData}
					onFieldChange={handleFieldChange}
					drugs={drugs}
					drugsLoading={drugsLoading}
				/>

				<div className="flex gap-4 mt-8 pt-6 border-t border-stone-200">
					<button
						type="button"
						onClick={() => router.back()}
						disabled={isSubmitting}
						className="flex-1 h-12 rounded-xl border border-stone-200 bg-white text-stone-900 font-medium hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className="flex-1 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSubmitting ? "Creating..." : "Create Medication"}
					</button>
				</div>
			</form>

			{showSuccessDialog && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl p-8 max-w-md w-full">
						<div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<h3 className="text-xl font-semibold text-stone-900 text-center mb-2">Medication Created</h3>
						<p className="text-stone-600 text-center mb-6">The medication has been successfully created.</p>
						<button
							onClick={handleDialogClose}
							className="w-full h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							View Medications
						</button>
					</div>
				</div>
			)}
		</>
	);
}