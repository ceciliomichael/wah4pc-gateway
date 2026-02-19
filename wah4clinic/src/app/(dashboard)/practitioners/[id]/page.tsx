"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { LucideArrowLeft, LucideEdit, LucideSave, LucideX } from "lucide-react";
import { PractitionerForm } from "@/components/practitioner/practitioner-form";
import { fhirToFormData, buildFHIRPractitioner, type PractitionerFormData, type FHIRPractitioner } from "@/lib/practitioner-utils";
import { usePSGC } from "@/hooks/use-terminology";
import { isNCR } from "@/lib/psgc-utils";

export default function PractitionerDetailPage() {
	const router = useRouter();
	const params = useParams();
	const practitionerId = params.id as string;

	const [practitioner, setPractitioner] = useState<FHIRPractitioner | null>(null);
	const [formData, setFormData] = useState<PractitionerFormData | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const regionIsNCR = isNCR(formData?.region || "");

	const { data: regions } = usePSGC("region");
	const { data: provinces } = usePSGC("province", regionIsNCR ? undefined : (formData?.region || undefined));
	const { data: cities } = usePSGC("city", regionIsNCR ? (formData?.region || undefined) : (formData?.province || undefined));
	const { data: barangays } = usePSGC("barangay", formData?.cityMunicipality || undefined);

	useEffect(() => {
		fetchPractitioner();
	}, [practitionerId]);

	const fetchPractitioner = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`/api/practitioners/${practitionerId}`);

			if (!response.ok) {
				throw new Error("Practitioner not found");
			}

			const data: FHIRPractitioner = await response.json();
			setPractitioner(data);
			setFormData(fhirToFormData(data));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load practitioner");
		} finally {
			setLoading(false);
		}
	};

	const handleFieldChange = (field: keyof PractitionerFormData, value: string) => {
		setFormData((prev) => {
			if (!prev) return null;
			return { ...prev, [field]: value };
		});
	};

	const handleSave = async () => {
		if (!formData || !practitioner) return;

		try {
			setSaving(true);
			setError(null);

			const fhirPractitioner = buildFHIRPractitioner(formData, {
				regions,
				provinces,
				cities,
				barangays,
			});

			const response = await fetch(`/api/practitioners/${practitionerId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirPractitioner),
			});

			if (!response.ok) {
				throw new Error("Failed to update practitioner");
			}

			const updatedPractitioner: FHIRPractitioner = await response.json();
			setPractitioner(updatedPractitioner);
			setFormData(fhirToFormData(updatedPractitioner));
			setIsEditMode(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save changes");
		} finally {
			setSaving(false);
		}
	};

	const handleCancelEdit = () => {
		if (practitioner) {
			setFormData(fhirToFormData(practitioner));
		}
		setIsEditMode(false);
	};

	const getPractitionerName = (): string => {
		if (!practitioner?.name[0]) return "Unknown Practitioner";
		const name = practitioner.name[0];
		const prefix = name.prefix?.[0] || "";
		const givenNames = name.given.join(" ");
		const suffix = name.suffix?.[0] || "";
		return `${prefix} ${givenNames} ${name.family} ${suffix}`.trim();
	};

	if (loading) {
		return (
			<div className="p-4 lg:p-8">
				<div className="max-w-4xl mx-auto">
					<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12">
						<div className="flex items-center justify-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error || !practitioner || !formData) {
		return (
			<div className="p-4 lg:p-8">
				<div className="max-w-4xl mx-auto">
					<div className="bg-tertiary-50 border border-tertiary-200 rounded-2xl p-8">
						<h2 className="text-xl font-semibold text-tertiary-900 mb-2">Error Loading Practitioner</h2>
						<p className="text-tertiary-700 mb-4">{error || "Practitioner not found"}</p>
						<button
							onClick={() => router.push("/practitioners")}
							className="px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							Back to Practitioners
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 lg:p-8">
			<div className="max-w-4xl mx-auto">
				<div className="mb-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<button
							onClick={() => router.push("/practitioners")}
							className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
						>
							<LucideArrowLeft className="w-5 h-5" />
							<span className="hidden sm:inline">Back to Practitioners</span>
							<span className="sm:hidden">Back</span>
						</button>

						{!isEditMode ? (
							<button
								onClick={() => setIsEditMode(true)}
								className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all"
							>
								<LucideEdit className="w-5 h-5" />
								<span>Edit Practitioner</span>
							</button>
						) : (
							<div className="flex flex-col sm:flex-row gap-3">
								<button
									onClick={handleCancelEdit}
									disabled={saving}
									className="flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-100 text-stone-900 font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<LucideX className="w-5 h-5" />
									<span>Cancel</span>
								</button>
								<button
									onClick={handleSave}
									disabled={saving}
									className="flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
								>
									<LucideSave className="w-5 h-5" />
									<span>{saving ? "Saving..." : "Save Changes"}</span>
								</button>
							</div>
						)}
					</div>
				</div>

				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 sm:p-8">
					<div className="mb-8">
						<div className="flex items-center gap-4 mb-4">
							<div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
								<span className="text-xl sm:text-2xl font-semibold text-secondary-600">
									{formData.firstName.charAt(0)}
									{formData.lastName.charAt(0)}
								</span>
							</div>
							<div className="min-w-0">
								<h2 className="text-xl sm:text-2xl font-semibold text-stone-900 truncate">{getPractitionerName()}</h2>
								<p className="text-xs sm:text-sm text-stone-600 truncate">Practitioner ID: {practitionerId}</p>
							</div>
						</div>
						{isEditMode && (
							<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
								<p className="text-sm text-amber-800">
									<strong>Edit Mode:</strong> Make changes to the practitioner information below and click "Save Changes" when done.
								</p>
							</div>
						)}
					</div>

					<PractitionerForm
						formData={formData}
						onFieldChange={handleFieldChange}
						disabled={!isEditMode}
					/>
				</div>
			</div>
		</div>
	);
}