"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppointmentForm } from "./appointment-form";
import { buildFHIRAppointment, type AppointmentFormData, type Patient, type Practitioner } from "@/lib/appointment-utils";

export function AppointmentRegistrationForm() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
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
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchResources();
	}, []);

	const fetchResources = async () => {
		try {
			setLoading(true);
			const [patientsRes, practitionersRes] = await Promise.all([
				fetch("/api/patients"),
				fetch("/api/practitioners"),
			]);

			if (!patientsRes.ok || !practitionersRes.ok) {
				throw new Error("Failed to fetch resources");
			}

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
		} catch (error) {
			console.error("Error fetching resources:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleFieldChange = (field: keyof AppointmentFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const fhirAppointment = buildFHIRAppointment(formData, patientsData, practitionersData);

			const response = await fetch("/api/appointments", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirAppointment),
			});

			if (!response.ok) {
				throw new Error("Failed to create appointment");
			}

			setShowSuccessDialog(true);
		} catch (error) {
			console.error("Error creating appointment:", error);
			alert("Failed to create appointment. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDialogClose = () => {
		setShowSuccessDialog(false);
		router.push("/appointments");
	};

	if (loading) {
		return (
			<div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-stone-100 shadow-sm p-12">
				<div className="flex items-center justify-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
				</div>
			</div>
		);
	}

	return (
		<>
			<form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-stone-100 shadow-sm p-8">
				<div className="mb-8">
					<h2 className="text-2xl font-semibold text-stone-900 mb-2">New Appointment</h2>
					<p className="text-sm text-stone-600">Please fill out all required fields marked with *</p>
				</div>

				<AppointmentForm
					formData={formData}
					onFieldChange={handleFieldChange}
					patients={patients}
					practitioners={practitioners}
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
						{isSubmitting ? "Creating..." : "Create Appointment"}
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
						<h3 className="text-xl font-semibold text-stone-900 text-center mb-2">Appointment Created</h3>
						<p className="text-stone-600 text-center mb-6">The appointment has been successfully created.</p>
						<button
							onClick={handleDialogClose}
							className="w-full h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							View Appointments
						</button>
					</div>
				</div>
			)}
		</>
	);
}