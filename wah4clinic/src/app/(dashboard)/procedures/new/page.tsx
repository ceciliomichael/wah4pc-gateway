"use client";

import { ProcedureRegistrationForm } from "@/components/procedure/procedure-registration-form";

export default function NewProcedurePage() {
	return (
		<div className="p-4 lg:p-8">
			<div className="max-w-4xl mx-auto">
				<div className="mb-8">
					<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">New Procedure</h1>
					<p className="text-stone-600">Record a new medical procedure</p>
				</div>

				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 sm:p-8">
					<ProcedureRegistrationForm />
				</div>
			</div>
		</div>
	);
}