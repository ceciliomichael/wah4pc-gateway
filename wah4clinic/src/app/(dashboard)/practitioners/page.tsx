"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LucidePlus, LucideUserCog, LucidePhone, LucideMapPin } from "lucide-react";

interface PractitionerName {
	prefix?: string[];
	family: string;
	given: string[];
	suffix?: string[];
}

interface PractitionerTelecom {
	system: string;
	value: string;
	use?: string;
}

interface PractitionerAddress {
	line: string[];
	city?: string;
	district?: string;
	postalCode?: string;
}

interface PractitionerIdentifier {
	system: string;
	value: string;
}

interface Practitioner {
	id: string;
	name: PractitionerName[];
	telecom: PractitionerTelecom[];
	gender: string;
	birthDate: string;
	address: PractitionerAddress[];
	identifier?: PractitionerIdentifier[];
}

interface BundleEntry {
	resource: Practitioner;
}

interface PractitionersBundle {
	total: number;
	entry: BundleEntry[];
}

export default function PractitionersPage() {
	const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchPractitioners();
	}, []);

	const fetchPractitioners = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/practitioners");

			if (!response.ok) {
				throw new Error("Failed to fetch practitioners");
			}

			const bundle: PractitionersBundle = await response.json();
			setPractitioners(bundle.entry.map((entry) => entry.resource));
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const getPractitionerName = (practitioner: Practitioner): string => {
		const officialName = practitioner.name.find((n) => n.family);
		if (!officialName) return "Unknown";

		const prefix = officialName.prefix?.[0] || "";
		const givenNames = officialName.given.join(" ");
		const suffix = officialName.suffix?.[0] || "";

		return `${prefix} ${givenNames} ${officialName.family} ${suffix}`.trim();
	};

	const getPractitionerPhone = (practitioner: Practitioner): string => {
		const mobilePhone = practitioner.telecom.find((t) => t.system === "phone");
		return mobilePhone?.value || "N/A";
	};

	const getPractitionerAddress = (practitioner: Practitioner): string => {
		const address = practitioner.address[0];
		if (!address) return "N/A";

		const parts = [
			address.city,
			address.district,
		].filter(Boolean);

		return parts.join(", ") || "N/A";
	};

	const getPRCLicense = (practitioner: Practitioner): string => {
		const prcId = practitioner.identifier?.find((i) => 
			i.system === "http://prc.gov.ph/fhir/Identifier/prc-license"
		);
		return prcId?.value || "N/A";
	};

	return (
		<div className="p-4 lg:p-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<div>
					<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">Practitioners</h1>
					<p className="text-stone-600">
						{loading ? "Loading..." : `${practitioners.length} practitioner${practitioners.length !== 1 ? "s" : ""} registered`}
					</p>
				</div>
				<Link
					href="/practitioners/new"
					className="flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
				>
					<LucidePlus className="w-5 h-5" />
					<span className="hidden sm:inline">Register New Practitioner</span>
					<span className="sm:hidden">New Practitioner</span>
				</Link>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
					<p className="text-red-800 text-sm">{error}</p>
				</div>
			)}

			{loading ? (
				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12">
					<div className="flex items-center justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
					</div>
				</div>
			) : practitioners.length === 0 ? (
				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12">
					<div className="text-center">
						<div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<LucideUserCog className="w-8 h-8 text-stone-400" />
						</div>
						<h3 className="text-lg font-medium text-stone-900 mb-2">No practitioners registered yet</h3>
						<p className="text-stone-600 mb-6">Get started by registering your first practitioner</p>
						<Link
							href="/practitioners/new"
							className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							<LucidePlus className="w-5 h-5" />
							Register New Practitioner
						</Link>
					</div>
				</div>
			) : (
				<>
					{/* Mobile Card View */}
					<div className="lg:hidden space-y-4">
						{practitioners.map((practitioner) => (
							<div key={practitioner.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:shadow-md transition-shadow">
								<div className="flex items-start gap-3 mb-3">
									<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
										<LucideUserCog className="w-6 h-6 text-blue-600" />
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="font-semibold text-stone-900 mb-1">{getPractitionerName(practitioner)}</h3>
										<p className="text-sm text-stone-500">ID: {practitioner.id.slice(0, 8)}</p>
									</div>
								</div>
								
								<div className="space-y-2 mb-4">
									<div className="flex items-center gap-2 text-sm">
										<span className="text-stone-600 font-medium min-w-24">PRC License:</span>
										<span className="text-stone-900 truncate">{getPRCLicense(practitioner)}</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										<LucidePhone className="w-4 h-4 text-stone-400 flex-shrink-0" />
										<span className="text-stone-900">{getPractitionerPhone(practitioner)}</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										<LucideMapPin className="w-4 h-4 text-stone-400 flex-shrink-0" />
										<span className="text-stone-900 truncate">{getPractitionerAddress(practitioner)}</span>
									</div>
								</div>
								
								<Link
									href={`/practitioners/${practitioner.id}`}
									className="block w-full text-center px-4 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
								>
									View Details
								</Link>
							</div>
						))}
					</div>

					{/* Desktop Table View */}
					<div className="hidden lg:block bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-stone-50 border-b border-stone-200">
									<tr>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Practitioner Name</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">PRC License</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Contact</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Location</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-stone-100">
									{practitioners.map((practitioner) => (
										<tr key={practitioner.id} className="hover:bg-stone-50 transition-colors">
											<td className="px-6 py-4">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
														<LucideUserCog className="w-5 h-5 text-blue-600" />
													</div>
													<div>
														<p className="font-medium text-stone-900">{getPractitionerName(practitioner)}</p>
														<p className="text-sm text-stone-500">ID: {practitioner.id.slice(0, 8)}</p>
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												<p className="text-stone-900 text-sm">{getPRCLicense(practitioner)}</p>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2 text-stone-900">
													<LucidePhone className="w-4 h-4 text-stone-400" />
													<span className="text-sm">{getPractitionerPhone(practitioner)}</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2 text-stone-900">
													<LucideMapPin className="w-4 h-4 text-stone-400" />
													<span className="text-sm">{getPractitionerAddress(practitioner)}</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<Link
													href={`/practitioners/${practitioner.id}`}
													className="inline-block px-4 py-2 rounded-lg bg-stone-100 text-stone-900 text-sm font-medium hover:bg-stone-200 transition-colors"
												>
													View Details
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</>
			)}
		</div>
	);
}