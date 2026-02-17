import { ObservationRegistrationForm } from "@/components/observation/observation-registration-form";

interface ObservationDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function ObservationDetailPage({ params }: ObservationDetailPageProps) {
	const { id } = await params;

	return (
		<div className="p-4 lg:p-8">
			<div className="mb-8">
				<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">Edit Observation</h1>
				<p className="text-stone-600">Update observation details</p>
			</div>

			<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 lg:p-8">
				<ObservationRegistrationForm observationId={id} />
			</div>
		</div>
	);
}