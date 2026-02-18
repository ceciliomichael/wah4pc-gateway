import { DiagnosticReportRegistrationForm } from "@/components/diagnostic-report/diagnostic-report-registration-form";

export default function NewDiagnosticReportPage() {
	return (
		<div className="p-4 lg:p-8">
			<div className="mb-8">
				<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">
					New Diagnostic Report
				</h1>
				<p className="text-stone-600">Create a new diagnostic report</p>
			</div>

			<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 lg:p-8">
				<DiagnosticReportRegistrationForm />
			</div>
		</div>
	);
}
