"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PractitionerForm } from "@/components/practitioner/practitioner-form";
import { buildFHIRPractitioner, type PractitionerFormData } from "@/lib/practitioner-utils";
import { usePSGC } from "@/hooks/use-terminology";
import { isNCR } from "@/lib/psgc-utils";

export function PractitionerRegistrationForm() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [formData, setFormData] = useState<PractitionerFormData>({
		firstName: "",
		middleName: "",
		lastName: "",
		prefix: "",
		suffix: "",
		birthDate: "",
		gender: "",
		email: "",
		mobilePhone: "",
		workPhone: "",
		prcLicense: "",
		tinNumber: "",
		streetAddress: "",
		region: "",
		province: "",
		cityMunicipality: "",
		barangay: "",
		postalCode: "",
	});

	const regionIsNCR = isNCR(formData.region);

	const { data: regions } = usePSGC("region");
	const { data: provinces } = usePSGC("province", regionIsNCR ? undefined : (formData.region || undefined));
	const { data: cities } = usePSGC("city", regionIsNCR ? formData.region : (formData.province || undefined));
	const { data: barangays } = usePSGC("barangay", formData.cityMunicipality || undefined);

	const handleFieldChange = (field: keyof PractitionerFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const fhirPractitioner = buildFHIRPractitioner(formData, {
				regions,
				provinces,
				cities,
				barangays,
			});

			const response = await fetch("/api/practitioners", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirPractitioner),
			});

			if (!response.ok) {
				throw new Error("Failed to register practitioner");
			}

			setShowSuccessDialog(true);
		} catch (error) {
			console.error("Error registering practitioner:", error);
			alert("Failed to register practitioner. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDialogClose = () => {
		setShowSuccessDialog(false);
		router.push("/practitioners");
	};

	return (
		<>
			<form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-stone-100 shadow-sm p-8">
				<div className="mb-8">
					<h2 className="text-2xl font-semibold text-stone-900 mb-2">Practitioner Registration</h2>
					<p className="text-sm text-stone-600">Please fill out all required fields marked with *</p>
				</div>

				<PractitionerForm
					formData={formData}
					onFieldChange={handleFieldChange}
					disabled={isSubmitting}
				/>

				<div className="mt-8 flex justify-end gap-4">
					<button
						type="button"
						onClick={() => router.push("/practitioners")}
						disabled={isSubmitting}
						className="px-6 h-12 rounded-xl bg-stone-100 text-stone-900 font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className="px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
					>
						{isSubmitting ? "Registering..." : "Register Practitioner"}
					</button>
				</div>
			</form>

			{showSuccessDialog && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl p-8 max-w-md w-full">
						<div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-8 h-8 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<h3 className="text-xl font-semibold text-stone-900 text-center mb-2">Registration Successful</h3>
						<p className="text-stone-600 text-center mb-6">
							The practitioner has been registered successfully.
						</p>
						<button
							onClick={handleDialogClose}
							className="w-full h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							View Practitioners List
						</button>
					</div>
				</div>
			)}
		</>
	);
}