"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LucidePlus, LucideCalendar, LucideClock } from "lucide-react";

interface Appointment {
	id: string;
	status: string;
	appointmentType?: {
		coding: Array<{
			code: string;
			display: string;
		}>;
	};
	description?: string;
	start?: string;
	end?: string;
	participant: Array<{
		actor: {
			type: string;
			display: string;
		};
	}>;
}

interface BundleEntry {
	resource: Appointment;
}

interface AppointmentsBundle {
	total: number;
	entry: BundleEntry[];
}

export default function AppointmentsPage() {
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchAppointments();
	}, []);

	const fetchAppointments = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/appointments");

			if (!response.ok) {
				throw new Error("Failed to fetch appointments");
			}

			const bundle: AppointmentsBundle = await response.json();
			setAppointments(bundle.entry?.map((entry) => entry.resource) || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const formatDateTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusBadgeColor = (status: string) => {
		const colors: Record<string, string> = {
			proposed: "bg-slate-100 text-slate-800",
			pending: "bg-yellow-100 text-yellow-800",
			booked: "bg-blue-100 text-blue-800",
			arrived: "bg-purple-100 text-purple-800",
			fulfilled: "bg-green-100 text-green-800",
			cancelled: "bg-red-100 text-red-800",
			noshow: "bg-orange-100 text-orange-800",
		};
		return colors[status] || "bg-stone-100 text-stone-800";
	};

	const getPatientName = (appointment: Appointment) => {
		const patient = appointment.participant?.find((p) => p.actor?.type === "Patient");
		return patient?.actor?.display || "N/A";
	};

	const getPractitionerName = (appointment: Appointment) => {
		const practitioner = appointment.participant?.find((p) => p.actor?.type === "Practitioner");
		return practitioner?.actor?.display || "N/A";
	};

	return (
		<div className="p-4 lg:p-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<div>
					<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">Appointments</h1>
					<p className="text-stone-600">
						{loading ? "Loading..." : `${appointments.length} appointment${appointments.length !== 1 ? "s" : ""} scheduled`}
					</p>
				</div>
				<Link
					href="/appointments/new"
					className="flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
				>
					<LucidePlus className="w-5 h-5" />
					<span className="hidden sm:inline">New Appointment</span>
					<span className="sm:hidden">New</span>
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
			) : appointments.length === 0 ? (
				<div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12">
					<div className="text-center">
						<div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<LucideCalendar className="w-8 h-8 text-stone-400" />
						</div>
						<h3 className="text-lg font-medium text-stone-900 mb-2">No appointments scheduled yet</h3>
						<p className="text-stone-600 mb-6">Get started by creating your first appointment</p>
						<Link
							href="/appointments/new"
							className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							<LucidePlus className="w-5 h-5" />
							New Appointment
						</Link>
					</div>
				</div>
			) : (
				<>
					{/* Mobile Card View */}
					<div className="lg:hidden space-y-4">
						{appointments.map((appointment) => (
							<div key={appointment.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:shadow-md transition-shadow">
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center gap-2">
										<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
											<LucideCalendar className="w-5 h-5 text-blue-600" />
										</div>
										<div>
											<span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(appointment.status)}`}>
												{appointment.status}
											</span>
										</div>
									</div>
								</div>
								
								<div className="space-y-2 mb-4">
									<div className="text-sm">
										<span className="text-stone-600 font-medium">Patient:</span>
										<span className="text-stone-900 ml-2">{getPatientName(appointment)}</span>
									</div>
									<div className="text-sm">
										<span className="text-stone-600 font-medium">Practitioner:</span>
										<span className="text-stone-900 ml-2">{getPractitionerName(appointment)}</span>
									</div>
									{appointment.appointmentType && (
										<div className="text-sm">
											<span className="text-stone-600 font-medium">Type:</span>
											<span className="text-stone-900 ml-2">{appointment.appointmentType.coding[0]?.display || "N/A"}</span>
										</div>
									)}
									{appointment.start && (
										<div className="flex items-center gap-2 text-sm">
											<LucideClock className="w-4 h-4 text-stone-400" />
											<span className="text-stone-900">{formatDateTime(appointment.start)}</span>
										</div>
									)}
								</div>
								
								<Link
									href={`/appointments/${appointment.id}`}
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
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Status</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Patient</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Practitioner</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Type</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Date & Time</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-stone-900">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-stone-100">
									{appointments.map((appointment) => (
										<tr key={appointment.id} className="hover:bg-stone-50 transition-colors">
											<td className="px-6 py-4">
												<span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(appointment.status)}`}>
													{appointment.status}
												</span>
											</td>
											<td className="px-6 py-4">
												<p className="font-medium text-stone-900">{getPatientName(appointment)}</p>
												<p className="text-sm text-stone-500">ID: {appointment.id.slice(0, 8)}</p>
											</td>
											<td className="px-6 py-4">
												<p className="text-stone-900">{getPractitionerName(appointment)}</p>
											</td>
											<td className="px-6 py-4">
												<p className="text-stone-900">{appointment.appointmentType?.coding[0]?.display || "N/A"}</p>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2 text-stone-900">
													<LucideClock className="w-4 h-4 text-stone-400" />
													<span className="text-sm">{appointment.start ? formatDate(appointment.start) : "N/A"}</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<Link
													href={`/appointments/${appointment.id}`}
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