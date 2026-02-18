"use client";

import { useParams } from "next/navigation";
import { DiagnosticReportRegistrationForm } from "@/components/diagnostic-report/diagnostic-report-registration-form";

export default function DiagnosticReportDetailPage() {
	const params = useParams();
	const diagnosticReportId = params.id as string;

	return (
		<div className="p-4 lg:p-8">
			<div className="mb-8">
				<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">
					Diagnostic Report Details
				</h1>
				<p className="text-stone-600">
					View and update diagnostic report {diagnosticReportId}
				</p>
			</div>

			<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 lg:p-8">
				<DiagnosticReportRegistrationForm
					diagnosticReportId={diagnosticReportId}
				/>
			</div>
		</div>
	);
}
