"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppointmentForm } from "@/components/appointment/appointment-form";
import { fhirToFormData, buildFHIRAppointment, type AppointmentFormData, type Patient, type Practitioner } from "@/lib/appointment-utils";

interface AppointmentTypeOption {
	code: string;
	display: string;
}

export default function AppointmentDetailPage() {
	const router = useRouter();
	const params = useParams();
	const appointmentId = params.id as string;

	const [isEditing, setIsEditing] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [formData, setFormData] = useState<AppointmentFormData>({
		status: "",
		appointmentType: "",
		patientId: "",
		practitionerId: "",
		start: "",
		end: "",
		description: "",
		comment: "",
	});

	const [patients, setPatients] = useState<Array<{ code: string; display: string }>>([]);
	const [practitioners, setPractitioners] = useState<Array<{ code: string; display: string }>>([]);
	const [patientsData, setPatientsData] = useState<Patient[]>([]);
	const [practitionersData, setPractitionersData] = useState<Practitioner[]>([]);
	const [customAppointmentTypeOption, setCustomAppointmentTypeOption] = useState<AppointmentTypeOption | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchResources();
	}, []);

	const fetchResources = async () => {
		try {
			setLoading(true);
			const [appointmentRes, patientsRes, practitionersRes] = await Promise.all([
				fetch(`/api/appointments/${appointmentId}`),
				fetch("/api/patients"),
				fetch("/api/practitioners"),
			]);

			if (!appointmentRes.ok || !patientsRes.ok || !practitionersRes.ok) {
				throw new Error("Failed to fetch resources");
			}

			const appointment = await appointmentRes.json();
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

			setFormData(
				fhirToFormData(appointment, {
					patients: patientsArray,
					practitioners: practitionersArray,
				}),
			);

			const incomingTypeCoding = appointment?.appointmentType?.coding?.[0];
			if (incomingTypeCoding?.code) {
				setCustomAppointmentTypeOption({
					code: incomingTypeCoding.code,
					display: incomingTypeCoding.display || incomingTypeCoding.code,
				});
			} else {
				setCustomAppointmentTypeOption(null);
			}
		} catch (error) {
			console.error("Error fetching resources:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleFieldChange = (field: keyof AppointmentFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const fhirAppointment = buildFHIRAppointment(formData, patientsData, practitionersData);

			const response = await fetch(`/api/appointments/${appointmentId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirAppointment),
			});

			if (!response.ok) {
				throw new Error("Failed to update appointment");
			}

			setIsEditing(false);
			await fetchResources();
		} catch (error) {
			console.error("Error updating appointment:", error);
			alert("Failed to update appointment. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		try {
			const response = await fetch(`/api/appointments/${appointmentId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete appointment");
			}

			router.push("/appointments");
		} catch (error) {
			console.error("Error deleting appointment:", error);
			alert("Failed to delete appointment. Please try again.");
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
			<form onSubmit={handleUpdate} className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-stone-100 shadow-sm p-8">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h2 className="text-2xl font-semibold text-stone-900 mb-2">
							{isEditing ? "Edit Appointment" : "Appointment Details"}
						</h2>
						<p className="text-sm text-stone-600">ID: {appointmentId}</p>
					</div>
					{!isEditing && (
						<button
							type="button"
							onClick={() => setIsEditing(true)}
							className="px-6 h-10 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
						>
							Edit
						</button>
					)}
				</div>

				<AppointmentForm
					formData={formData}
					onFieldChange={handleFieldChange}
					patients={patients}
					practitioners={practitioners}
					customAppointmentTypeOption={customAppointmentTypeOption}
					disabled={!isEditing}
				/>

				{isEditing ? (
					<div className="flex gap-4 mt-8 pt-6 border-t border-stone-200">
						<button
							type="button"
							onClick={() => {
								setIsEditing(false);
								fetchResources();
							}}
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
							{isSubmitting ? "Saving..." : "Save Changes"}
						</button>
					</div>
				) : (
					<div className="flex gap-4 mt-8 pt-6 border-t border-stone-200">
						<button
							type="button"
							onClick={() => router.back()}
							className="flex-1 h-12 rounded-xl border border-stone-200 bg-white text-stone-900 font-medium hover:bg-stone-50 transition-colors"
						>
							Back
						</button>
						<button
							type="button"
							onClick={() => setShowDeleteDialog(true)}
							className="flex-1 h-12 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
						>
							Delete
						</button>
					</div>
				)}
			</form>

			{showDeleteDialog && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl p-8 max-w-md w-full">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
						</div>
						<h3 className="text-xl font-semibold text-stone-900 text-center mb-2">Delete Appointment</h3>
						<p className="text-stone-600 text-center mb-6">Are you sure you want to delete this appointment? This action cannot be undone.</p>
						<div className="flex gap-4">
							<button
								onClick={() => setShowDeleteDialog(false)}
								className="flex-1 h-12 rounded-xl border border-stone-200 bg-white text-stone-900 font-medium hover:bg-stone-50 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleDelete}
								className="flex-1 h-12 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
