"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LucidePlus, LucideUser, LucidePhone, LucideMapPin } from "lucide-react";

interface PatientName {
	family: string;
	given: string[];
}

interface PatientTelecom {
	system: string;
	value: string;
}

interface PatientAddress {
	line: string[];
	city?: string;
	district?: string;
	postalCode?: string;
}

interface Patient {
	id: string;
	name: PatientName[];
	telecom: PatientTelecom[];
	gender: string;
	birthDate: string;
	address: PatientAddress[];
}

interface BundleEntry {
	resource: Patient;
}

interface PatientsBundle {
	total: number;
	entry: BundleEntry[];
}

export default function PatientsPage() {
	const [patients, setPatients] = useState<Patient[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchPatients();
	}, []);

	const fetchPatients = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/patients");

			if (!response.ok) {
				throw new Error("Failed to fetch patients");
			}

			const bundle: PatientsBundle = await response.json();
			setPatients(bundle.entry.map((entry) => entry.resource));
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const getPatientName = (patient: Patient): string => {
		const officialName = patient.name.find((n) => n.family);
		if (!officialName) return "Unknown";

		const givenNames = officialName.given.join(" ");
		return `${givenNames} ${officialName.family}`;
	};

	const getPatientPhone = (patient: Patient): string => {
		const mobilePhone = patient.telecom.find((t) => t.system === "phone");
		return mobilePhone?.value || "N/A";
	};

	const getPatientAddress = (patient: Patient): string => {
		const address = patient.address[0];
		if (!address) return "N/A";

		const parts = [
			address.city,
			address.district,
		].filter(Boolean);

		return parts.join(", ") || "N/A";
	};

	const calculateAge = (birthDate: string): number => {
		const today = new Date();
		const birth = new Date(birthDate);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();

		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}

		return age;
	};

	return (
		<div className="p-4 lg:p-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<div>
					<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">Patients</h1>
					<p className="text-stone-600">
						{loading ? "Loading..." : `${patients.length} patient${patients.length !== 1 ? "s" : ""} registered`}
					</p>
				</div>
				<Link
					href="/patients/new"
					className="flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
				>
					<LucidePlus className="w-5 h-5" />
					<span className="hidden sm:inline">Register New Patient</span>
					<span className="sm:hidden">New Patient</span>
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
			) : patients.length === 0 ? (
				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12">
					<div className="text-center">
						<div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<LucideUser className="w-8 h-8 text-stone-400" />
						</div>
						<h3 className="text-lg font-medium text-stone-900 mb-2">No patients registered yet</h3>
						<p className="text-stone-600 mb-6">Get started by registering your first patient</p>
						<Link
							href="/patients/new"
							className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							<LucidePlus className="w-5 h-5" />
							Register New Patient
						</Link>
					</div>
				</div>
			) : (
				<>
					{/* Mobile Card View */}
					<div className="lg:hidden space-y-4">
						{patients.map((patient) => (
							<div key={patient.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:shadow-md transition-shadow">
								<div className="flex items-start gap-3 mb-3">
									<div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
										<LucideUser className="w-6 h-6 text-amber-600" />
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="font-semibold text-stone-900 mb-1">{getPatientName(patient)}</h3>
										<p className="text-sm text-stone-500">ID: {patient.id.slice(0, 8)}</p>
									</div>
								</div>
								
								<div className="space-y-2 mb-4">
									<div className="flex items-center gap-2 text-sm">
										<span className="text-stone-600 font-medium min-w-20">Age:</span>
										<span className="text-stone-900">{calculateAge(patient.birthDate)} years ({patient.gender})</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										<LucidePhone className="w-4 h-4 text-stone-400 flex-shrink-0" />
										<span className="text-stone-900">{getPatientPhone(patient)}</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										<LucideMapPin className="w-4 h-4 text-stone-400 flex-shrink-0" />
										<span className="text-stone-900 truncate">{getPatientAddress(patient)}</span>
									</div>
								</div>
								
								<Link
									href={`/patients/${patient.id}`}
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
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Patient Name</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Age/Gender</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Contact</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Location</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-stone-100">
									{patients.map((patient) => (
										<tr key={patient.id} className="hover:bg-stone-50 transition-colors">
											<td className="px-6 py-4">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
														<LucideUser className="w-5 h-5 text-amber-600" />
													</div>
													<div>
														<p className="font-medium text-stone-900">{getPatientName(patient)}</p>
														<p className="text-sm text-stone-500">ID: {patient.id.slice(0, 8)}</p>
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												<p className="text-stone-900">
													{calculateAge(patient.birthDate)} years
												</p>
												<p className="text-sm text-stone-500 capitalize">{patient.gender}</p>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2 text-stone-900">
													<LucidePhone className="w-4 h-4 text-stone-400" />
													<span className="text-sm">{getPatientPhone(patient)}</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2 text-stone-900">
													<LucideMapPin className="w-4 h-4 text-stone-400" />
													<span className="text-sm">{getPatientAddress(patient)}</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<Link
													href={`/patients/${patient.id}`}
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