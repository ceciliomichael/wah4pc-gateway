"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { LucideArrowLeft, LucideEdit, LucideSave, LucideX, LucideTrash2 } from "lucide-react";
import { ProcedureForm } from "@/components/procedure/procedure-form";
import { fhirToFormData, buildFHIRProcedure, type ProcedureFormData, type FHIRProcedure } from "@/lib/procedure-utils";

export default function ProcedureDetailPage() {
	const router = useRouter();
	const params = useParams();
	const procedureId = params.id as string;

	const [procedure, setProcedure] = useState<FHIRProcedure | null>(null);
	const [formData, setFormData] = useState<ProcedureFormData | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [patients, setPatients] = useState<Array<{ code: string; display: string }>>([]);
	const [practitioners, setPractitioners] = useState<Array<{ code: string; display: string }>>([]);

	useEffect(() => {
		fetchProcedure();
		fetchPatients();
		fetchPractitioners();
	}, [procedureId]);

	const fetchProcedure = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`/api/procedures/${procedureId}`);

			if (!response.ok) {
				throw new Error("Procedure not found");
			}

			const data: FHIRProcedure = await response.json();
			setProcedure(data);
			setFormData(fhirToFormData(data));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load procedure");
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

	const handleFieldChange = (field: keyof ProcedureFormData, value: string) => {
		setFormData((prev) => {
			if (!prev) return null;
			return { ...prev, [field]: value };
		});
	};

	const handleSave = async () => {
		if (!formData || !procedure) return;

		try {
			setSaving(true);
			setError(null);

			const fhirProcedure = buildFHIRProcedure(formData, patients, practitioners);

			const response = await fetch(`/api/procedures/${procedureId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirProcedure),
			});

			if (!response.ok) {
				throw new Error("Failed to update procedure");
			}

			const updatedProcedure: FHIRProcedure = await response.json();
			setProcedure(updatedProcedure);
			setFormData(fhirToFormData(updatedProcedure));
			setIsEditMode(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save changes");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!window.confirm("Are you sure you want to delete this procedure? This action cannot be undone.")) {
			return;
		}

		try {
			setDeleting(true);
			setError(null);

			const response = await fetch(`/api/procedures/${procedureId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete procedure");
			}

			router.push("/procedures");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete procedure");
		} finally {
			setDeleting(false);
		}
	};

	const handleCancelEdit = () => {
		if (procedure) {
			setFormData(fhirToFormData(procedure));
		}
		setIsEditMode(false);
	};

	const getProcedureName = (): string => {
		if (!procedure?.code?.text) return "Unknown Procedure";
		return procedure.code.text;
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

	if (error || !procedure || !formData) {
		return (
			<div className="p-4 lg:p-8">
				<div className="max-w-4xl mx-auto">
					<div className="bg-tertiary-50 border border-tertiary-200 rounded-2xl p-8">
						<h2 className="text-xl font-semibold text-tertiary-900 mb-2">Error Loading Procedure</h2>
						<p className="text-tertiary-700 mb-4">{error || "Procedure not found"}</p>
						<button
							onClick={() => router.push("/procedures")}
							className="px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							Back to Procedures
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
							onClick={() => router.push("/procedures")}
							className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
						>
							<LucideArrowLeft className="w-5 h-5" />
							<span className="hidden sm:inline">Back to Procedures</span>
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
									<span>Edit Procedure</span>
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
									{formData.codeDisplay.charAt(0)}
								</span>
							</div>
							<div className="min-w-0">
								<h2 className="text-xl sm:text-2xl font-semibold text-stone-900 truncate">{getProcedureName()}</h2>
								<p className="text-xs sm:text-sm text-stone-600 truncate">Procedure ID: {procedureId}</p>
							</div>
						</div>
						{isEditMode && (
							<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
								<p className="text-sm text-amber-800">
									<strong>Edit Mode:</strong> Make changes to the procedure information below and click "Save Changes" when done.
								</p>
							</div>
						)}
					</div>

					<ProcedureForm
						formData={formData}
						onFieldChange={handleFieldChange}
						patients={patients}
						practitioners={practitioners}
						disabled={!isEditMode}
					/>
				</div>
			</div>
		</div>
	);
}