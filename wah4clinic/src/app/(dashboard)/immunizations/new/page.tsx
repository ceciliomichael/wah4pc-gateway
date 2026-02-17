import { ImmunizationRegistrationForm } from "@/components/immunization/immunization-registration-form";

export default function NewImmunizationPage() {
	return (
		<div className="p-4 lg:p-8">
			<div className="mb-8">
				<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">New Immunization</h1>
				<p className="text-stone-600">Record a new immunization administration</p>
			</div>

			<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 lg:p-8">
				<ImmunizationRegistrationForm />
			</div>
		</div>
	);
}