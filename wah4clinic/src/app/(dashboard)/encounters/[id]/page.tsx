"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EncounterForm } from "@/components/encounter/encounter-form";
import { fhirToFormData, buildFHIREncounter, type EncounterFormData, type Patient, type Practitioner } from "@/lib/encounter-utils";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default function EncounterDetailPage({ params }: PageProps) {
	const router = useRouter();
	const [encounterId, setEncounterId] = useState<string>("");
	const [formData, setFormData] = useState<EncounterFormData>({
		status: "",
		class: "",
		type: "",
		patientId: "",
		practitionerId: "",
		periodStart: "",
		periodEnd: "",
		reasonCode: "",
		location: "",
	});

	const [patients, setPatients] = useState<Array<{ code: string; display: string }>>([]);
	const [practitioners, setPractitioners] = useState<Array<{ code: string; display: string }>>([]);
	const [patientsData, setPatientsData] = useState<Patient[]>([]);
	const [practitionersData, setPractitionersData] = useState<Practitioner[]>([]);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		params.then((p) => {
			setEncounterId(p.id);
			fetchData(p.id);
		});
	}, []);

	const fetchData = async (id: string) => {
		try {
			setLoading(true);
			const [encounterRes, patientsRes, practitionersRes] = await Promise.all([
				fetch(`/api/encounters/${id}`),
				fetch("/api/patients"),
				fetch("/api/practitioners"),
			]);

			if (!encounterRes.ok || !patientsRes.ok || !practitionersRes.ok) {
				throw new Error("Failed to fetch data");
			}

			const encounterData = await encounterRes.json();
			const patientsBundle = await patientsRes.json();
			const practitionersBundle = await practitionersRes.json();

			const patientsArray = patientsBundle.entry?.map((e: { resource: Patient }) => e.resource) || [];
			const practitionersArray = practitionersBundle.entry?.map((e: { resource: Practitioner }) => e.resource) || [];

			setPatientsData(patientsArray);
			setPractitionersData(practitionersArray);

			setPatients(
				patientsArray.map((p: Patient) => ({
					code: p.id,
					display: `${p.name[0].given.join(" ")} ${p.name[0].family}`,
				}))
			);

			setPractitioners(
				practitionersArray.map((p: Practitioner) => ({
					code: p.id,
					display: `${p.name[0].prefix?.[0] || ""} ${p.name[0].given.join(" ")} ${p.name[0].family}`.trim(),
				}))
			);

			setFormData(fhirToFormData(encounterData));
		} catch (error) {
			console.error("Error fetching data:", error);
			alert("Failed to load encounter. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleFieldChange = (field: keyof EncounterFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const fhirEncounter = buildFHIREncounter(formData, patientsData, practitionersData);

			const response = await fetch(`/api/encounters/${encounterId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirEncounter),
			});

			if (!response.ok) {
				throw new Error("Failed to update encounter");
			}

			router.push("/encounters");
		} catch (error) {
			console.error("Error updating encounter:", error);
			alert("Failed to update encounter. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);

		try {
			const response = await fetch(`/api/encounters/${encounterId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete encounter");
			}

			router.push("/encounters");
		} catch (error) {
			console.error("Error deleting encounter:", error);
			alert("Failed to delete encounter. Please try again.");
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	if (loading) {
		return (
			<div className="p-4 lg:p-8">
				<div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-stone-100 shadow-sm p-12">
					<div className="flex items-center justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 lg:p-8">
			<form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-stone-100 shadow-sm p-8">
				<div className="mb-8">
					<h2 className="text-2xl font-semibold text-stone-900 mb-2">Encounter Details</h2>
					<p className="text-sm text-stone-600">ID: {encounterId}</p>
				</div>

				<EncounterForm
					formData={formData}
					onFieldChange={handleFieldChange}
					patients={patients}
					practitioners={practitioners}
				/>

				<div className="flex gap-4 mt-8 pt-6 border-t border-stone-200">
					<button
						type="button"
						onClick={() => setShowDeleteDialog(true)}
						className="px-6 h-12 rounded-xl border border-red-200 bg-white text-red-600 font-medium hover:bg-red-50 transition-colors"
					>
						Delete
					</button>
					<div className="flex-1" />
					<button
						type="button"
						onClick={() => router.back()}
						disabled={isSubmitting}
						className="px-6 h-12 rounded-xl border border-stone-200 bg-white text-stone-900 font-medium hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className="px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSubmitting ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</form>

			{showDeleteDialog && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl p-8 max-w-md w-full">
						<h3 className="text-xl font-semibold text-stone-900 mb-2">Delete Encounter</h3>
						<p className="text-stone-600 mb-6">
							Are you sure you want to delete this encounter? This action cannot be undone.
						</p>
						<div className="flex gap-4">
							<button
								onClick={() => setShowDeleteDialog(false)}
								disabled={isDeleting}
								className="flex-1 h-12 rounded-xl border border-stone-200 bg-white text-stone-900 font-medium hover:bg-stone-50 transition-colors disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={handleDelete}
								disabled={isDeleting}
								className="flex-1 h-12 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
							>
								{isDeleting ? "Deleting..." : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}