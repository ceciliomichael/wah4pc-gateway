import { MedicationRequestRegistrationForm } from "@/components/medication-request/medication-request-registration-form";

export default function NewMedicationRequestPage() {
	return (
		<div className="p-4 lg:p-8">
			<div className="mb-8">
				<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">
					New Medication Request
				</h1>
				<p className="text-stone-600">Create a medication order request</p>
			</div>

			<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 lg:p-8">
				<MedicationRequestRegistrationForm />
			</div>
		</div>
	);
}
