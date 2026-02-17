import { ObservationRegistrationForm } from "@/components/observation/observation-registration-form";

export default function NewObservationPage() {
	return (
		<div className="p-4 lg:p-8">
			<div className="mb-8">
				<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">New Observation</h1>
				<p className="text-stone-600">Record a new patient observation</p>
			</div>

			<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 lg:p-8">
				<ObservationRegistrationForm />
			</div>
		</div>
	);
}