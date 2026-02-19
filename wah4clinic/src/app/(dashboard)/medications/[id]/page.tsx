"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { LucideArrowLeft, LucideEdit, LucideSave, LucideX, LucideTrash2 } from "lucide-react";
import { MedicationForm } from "@/components/medication/medication-form";
import { fhirToFormData, buildFHIRMedication, type MedicationFormData, type FHIRMedication } from "@/lib/medication-utils";
import { useCodeSystem } from "@/hooks/use-terminology";

export default function MedicationDetailPage() {
	const router = useRouter();
	const params = useParams();
	const medicationId = params.id as string;

	const [medication, setMedication] = useState<FHIRMedication | null>(null);
	const [formData, setFormData] = useState<MedicationFormData | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { data: drugs, loading: drugsLoading } = useCodeSystem("drugs");

	useEffect(() => {
		fetchMedication();
	}, [medicationId]);

	const fetchMedication = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`/api/medications/${medicationId}`);

			if (!response.ok) {
				throw new Error("Medication not found");
			}

			const data: FHIRMedication = await response.json();
			setMedication(data);
			setFormData(fhirToFormData(data));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load medication");
		} finally {
			setLoading(false);
		}
	};

	const handleFieldChange = (field: keyof MedicationFormData, value: string) => {
		setFormData((prev) => {
			if (!prev) return null;
			return { ...prev, [field]: value };
		});
	};

	const handleSave = async () => {
		if (!formData || !medication) return;

		try {
			setSaving(true);
			setError(null);

			const fhirMedication = buildFHIRMedication(formData, drugs);

			const response = await fetch(`/api/medications/${medicationId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirMedication),
			});

			if (!response.ok) {
				throw new Error("Failed to update medication");
			}

			const updatedMedication: FHIRMedication = await response.json();
			setMedication(updatedMedication);
			setFormData(fhirToFormData(updatedMedication));
			setIsEditMode(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save changes");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!window.confirm("Are you sure you want to delete this medication? This action cannot be undone.")) {
			return;
		}

		try {
			setDeleting(true);
			setError(null);

			const response = await fetch(`/api/medications/${medicationId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete medication");
			}

			router.push("/medications");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete medication");
		} finally {
			setDeleting(false);
		}
	};

	const handleCancelEdit = () => {
		if (medication) {
			setFormData(fhirToFormData(medication));
		}
		setIsEditMode(false);
	};

	const getMedicationName = (): string => {
		if (!medication?.code?.text) return "Unknown Medication";
		return medication.code.text;
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

	if (error || !medication || !formData) {
		return (
			<div className="p-4 lg:p-8">
				<div className="max-w-4xl mx-auto">
					<div className="bg-tertiary-50 border border-tertiary-200 rounded-2xl p-8">
						<h2 className="text-xl font-semibold text-tertiary-900 mb-2">Error Loading Medication</h2>
						<p className="text-tertiary-700 mb-4">{error || "Medication not found"}</p>
						<button
							onClick={() => router.push("/medications")}
							className="px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							Back to Medications
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
							onClick={() => router.push("/medications")}
							className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
						>
							<LucideArrowLeft className="w-5 h-5" />
							<span className="hidden sm:inline">Back to Medications</span>
							<span className="sm:hidden">Back</span>
						</button>

						{!isEditMode ? (
							<div className="flex flex-col sm:flex-row gap-3">
								<button
									onClick={handleDelete}
									disabled={deleting}
									className="flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-tertiary-100 text-tertiary-900 font-medium hover:bg-tertiary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<LucideTrash2 className="w-5 h-5" />
									<span>{deleting ? "Deleting..." : "Delete"}</span>
								</button>
								<button
									onClick={() => setIsEditMode(true)}
									className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all"
								>
									<LucideEdit className="w-5 h-5" />
									<span>Edit Medication</span>
								</button>
							</div>
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
							<div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
								<span className="text-xl sm:text-2xl font-semibold text-amber-600">
									{formData.drugDisplay.charAt(0)}
								</span>
							</div>
							<div className="min-w-0">
								<h2 className="text-xl sm:text-2xl font-semibold text-stone-900 truncate">{getMedicationName()}</h2>
								<p className="text-xs sm:text-sm text-stone-600 truncate">Medication ID: {medicationId}</p>
							</div>
						</div>
						{isEditMode && (
							<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
								<p className="text-sm text-amber-800">
									<strong>Edit Mode:</strong> Make changes to the medication information below and click "Save Changes" when done.
								</p>
							</div>
						)}
					</div>

					<MedicationForm
						formData={formData}
						onFieldChange={handleFieldChange}
						drugs={drugs}
						drugsLoading={drugsLoading}
						disabled={!isEditMode}
					/>
				</div>
			</div>
		</div>
	);
}