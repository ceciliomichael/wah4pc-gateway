"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { LucideArrowLeft, LucideEdit, LucideSave, LucideX } from "lucide-react";
import { PatientForm } from "@/components/patient/patient-form";
import { fhirToFormData, buildFHIRPatient, type PatientFormData, type FHIRPatient } from "@/lib/patient-utils";
import { usePSGC, useCodeSystem } from "@/hooks/use-terminology";
import { isNCR } from "@/lib/psgc-utils";

export default function PatientDetailPage() {
	const router = useRouter();
	const params = useParams();
	const patientId = params.id as string;

	const [patient, setPatient] = useState<FHIRPatient | null>(null);
	const [formData, setFormData] = useState<PatientFormData | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const regionIsNCR = isNCR(formData?.region || "");

	const { data: regions } = usePSGC("region");
	const { data: provinces } = usePSGC("province", regionIsNCR ? undefined : (formData?.region || undefined));
	const { data: cities } = usePSGC("city", regionIsNCR ? (formData?.region || undefined) : (formData?.province || undefined));
	const { data: barangays } = usePSGC("barangay", formData?.cityMunicipality || undefined);
	const { data: religions } = useCodeSystem("religion");
	const { data: races } = useCodeSystem("race");
	const { data: educations } = useCodeSystem("educational-attainment");
	const { data: occupations } = useCodeSystem("occupation");
	const { data: indigenousGroups } = useCodeSystem("indigenous-groups");

	useEffect(() => {
		fetchPatient();
	}, [patientId]);

	const fetchPatient = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`/api/patients/${patientId}`);

			if (!response.ok) {
				throw new Error("Patient not found");
			}

			const data: FHIRPatient = await response.json();
			setPatient(data);
			setFormData(fhirToFormData(data));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load patient");
		} finally {
			setLoading(false);
		}
	};

	const handleFieldChange = (field: keyof PatientFormData, value: string) => {
		setFormData((prev) => {
			if (!prev) return null;
			return { ...prev, [field]: value };
		});
	};

	const handleSave = async () => {
		if (!formData || !patient) return;

		try {
			setSaving(true);
			setError(null);

			const fhirPatient = buildFHIRPatient(formData, {
				regions,
				provinces,
				cities,
				barangays,
				religions,
				races,
				educations,
				occupations,
				indigenousGroups,
			});

			const response = await fetch(`/api/patients/${patientId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirPatient),
			});

			if (!response.ok) {
				throw new Error("Failed to update patient");
			}

			const updatedPatient: FHIRPatient = await response.json();
			setPatient(updatedPatient);
			setFormData(fhirToFormData(updatedPatient));
			setIsEditMode(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save changes");
		} finally {
			setSaving(false);
		}
	};

	const handleCancelEdit = () => {
		if (patient) {
			setFormData(fhirToFormData(patient));
		}
		setIsEditMode(false);
	};

	const getPatientName = (): string => {
		if (!patient?.name[0]) return "Unknown Patient";
		const name = patient.name[0];
		const givenNames = name.given.join(" ");
		return `${givenNames} ${name.family}`;
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

	if (error || !patient || !formData) {
		return (
			<div className="p-4 lg:p-8">
				<div className="max-w-4xl mx-auto">
					<div className="bg-tertiary-50 border border-tertiary-200 rounded-2xl p-8">
						<h2 className="text-xl font-semibold text-tertiary-900 mb-2">Error Loading Patient</h2>
						<p className="text-tertiary-700 mb-4">{error || "Patient not found"}</p>
						<button
							onClick={() => router.push("/patients")}
							className="px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							Back to Patients
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
							onClick={() => router.push("/patients")}
							className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
						>
							<LucideArrowLeft className="w-5 h-5" />
							<span className="hidden sm:inline">Back to Patients</span>
							<span className="sm:hidden">Back</span>
						</button>

						{!isEditMode ? (
							<button
								onClick={() => setIsEditMode(true)}
								className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all"
							>
								<LucideEdit className="w-5 h-5" />
								<span>Edit Patient</span>
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
							<div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
								<span className="text-xl sm:text-2xl font-semibold text-amber-600">
									{formData.firstName.charAt(0)}
									{formData.lastName.charAt(0)}
								</span>
							</div>
							<div className="min-w-0">
								<h2 className="text-xl sm:text-2xl font-semibold text-stone-900 truncate">{getPatientName()}</h2>
								<p className="text-xs sm:text-sm text-stone-600 truncate">Patient ID: {patientId}</p>
							</div>
						</div>
						{isEditMode && (
							<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
								<p className="text-sm text-amber-800">
									<strong>Edit Mode:</strong> Make changes to the patient information below and click "Save Changes" when done.
								</p>
							</div>
						)}
					</div>

					<PatientForm
						formData={formData}
						onFieldChange={handleFieldChange}
						disabled={!isEditMode}
					/>
				</div>
			</div>
		</div>
	);
}