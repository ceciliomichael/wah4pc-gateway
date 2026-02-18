import { NextResponse } from "next/server";
import { DataService } from "@/lib/server/data-service";

interface HumanName {
	use?: string;
	given?: string[];
	family?: string;
}

interface Coding {
	system?: string;
	code?: string;
	display?: string;
}

interface CodeableConcept {
	text?: string;
	coding?: Coding[];
}

interface FhirResource {
	resourceType: string;
	id: string;
	meta: {
		profile: string[];
		lastUpdated: string;
	};
	name?: HumanName[];
	status?: string;
	start?: string;
	type?: CodeableConcept[];
	class?: { display?: string };
	vaccineCode?: CodeableConcept;
	code?: CodeableConcept;
	[key: string]: unknown;
}

interface DashboardStats {
	patients: {
		total: number;
	};
	appointments: {
		total: number;
		today: number;
	};
	practitioners: {
		total: number;
	};
	encounters: {
		total: number;
		recent: number;
	};
	recentActivity: RecentActivityItem[];
}

interface RecentActivityItem {
	id: string;
	resourceType: string;
	action: "created" | "updated";
	timestamp: string;
	description: string;
	href: string;
}

function getPatientName(resource: FhirResource): string {
	const name = resource.name;
	if (!name || !Array.isArray(name) || name.length === 0) return "Unknown";
	const officialName = name.find((n: { use?: string }) => n.use === "official") || name[0];
	const given = Array.isArray(officialName.given) ? officialName.given.join(" ") : "";
	const family = officialName.family || "";
	return `${given} ${family}`.trim() || "Unknown";
}

function getPractitionerName(resource: FhirResource): string {
	const name = resource.name;
	if (!name || !Array.isArray(name) || name.length === 0) return "Unknown";
	const officialName = name.find((n: { use?: string }) => n.use === "official") || name[0];
	const given = Array.isArray(officialName.given) ? officialName.given.join(" ") : "";
	const family = officialName.family || "";
	return `${given} ${family}`.trim() || "Unknown";
}

function getAppointmentDescription(resource: FhirResource): string {
	const status = resource.status || "unknown";
	const start = resource.start ? new Date(resource.start).toLocaleDateString() : "No date";
	return `Appointment (${status}) - ${start}`;
}

function getEncounterDescription(resource: FhirResource): string {
	const status = resource.status || "unknown";
	const type = resource.type?.[0]?.text || resource.class?.display || "Consultation";
	return `${type} (${status})`;
}

function isToday(dateString: string): boolean {
	const date = new Date(dateString);
	const today = new Date();
	return (
		date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate()
	);
}

function isRecent(dateString: string, daysAgo = 7): boolean {
	const date = new Date(dateString);
	const now = new Date();
	const diffTime = now.getTime() - date.getTime();
	const diffDays = diffTime / (1000 * 60 * 60 * 24);
	return diffDays <= daysAgo;
}

export async function GET() {
	try {
		const patients = DataService.findAll<FhirResource>("Patient");
		const appointments = DataService.findAll<FhirResource>("Appointment");
		const practitioners = DataService.findAll<FhirResource>("Practitioner");
		const encounters = DataService.findAll<FhirResource>("Encounter");
		const immunizations = DataService.findAll<FhirResource>("Immunization");
		const medications = DataService.findAll<FhirResource>("Medication");
		const medicationRequests = DataService.findAll<FhirResource>("MedicationRequest");
		const observations = DataService.findAll<FhirResource>("Observation");
		const procedures = DataService.findAll<FhirResource>("Procedure");
		const diagnosticReports = DataService.findAll<FhirResource>("DiagnosticReport");

		// Calculate stats
		const todayAppointments = appointments.filter((a) => a.start && isToday(a.start));
		const recentEncounters = encounters.filter((e) => e.meta?.lastUpdated && isRecent(e.meta.lastUpdated));

		// Build recent activity from all resources
		const allResources: FhirResource[] = [
			...patients,
			...appointments,
			...practitioners,
			...encounters,
			...immunizations,
			...medications,
			...medicationRequests,
			...observations,
			...procedures,
			...diagnosticReports,
		];

		// Sort by lastUpdated descending and take top 10
		const recentResources = allResources
			.filter((r) => r.meta?.lastUpdated)
			.sort((a, b) => new Date(b.meta.lastUpdated).getTime() - new Date(a.meta.lastUpdated).getTime())
			.slice(0, 10);

		const recentActivity: RecentActivityItem[] = recentResources.map((resource) => {
			let description = "";
			const resourceType = resource.resourceType;

			switch (resourceType) {
				case "Patient":
					description = `Patient: ${getPatientName(resource)}`;
					break;
				case "Practitioner":
					description = `Practitioner: ${getPractitionerName(resource)}`;
					break;
				case "Appointment":
					description = getAppointmentDescription(resource);
					break;
				case "Encounter":
					description = getEncounterDescription(resource);
					break;
				case "Immunization":
					description = `Immunization: ${resource.vaccineCode?.text || resource.vaccineCode?.coding?.[0]?.display || "Unknown vaccine"}`;
					break;
				case "Medication":
					description = `Medication: ${resource.code?.text || resource.code?.coding?.[0]?.display || "Unknown medication"}`;
					break;
				case "MedicationRequest":
					description = `Medication Request: ${resource.code?.text || resource.code?.coding?.[0]?.display || resource.status || "Unknown request"}`;
					break;
				case "Observation":
					description = `Observation: ${resource.code?.text || resource.code?.coding?.[0]?.display || "Unknown observation"}`;
					break;
				case "Procedure":
					description = `Procedure: ${resource.code?.text || resource.code?.coding?.[0]?.display || "Unknown procedure"}`;
					break;
				case "DiagnosticReport":
					description = `Diagnostic Report: ${resource.code?.text || resource.code?.coding?.[0]?.display || resource.status || "Unknown report"}`;
					break;
				default:
					description = `${resourceType} record`;
			}

			const routeMap: Record<string, string> = {
				Patient: "patients",
				Practitioner: "practitioners",
				Appointment: "appointments",
				Encounter: "encounters",
				Immunization: "immunizations",
				Medication: "medications",
				MedicationRequest: "medication-requests",
				Observation: "observations",
				Procedure: "procedures",
				DiagnosticReport: "diagnostic-reports",
			};

			return {
				id: resource.id,
				resourceType,
				action: "created" as const,
				timestamp: resource.meta.lastUpdated,
				description,
				href: `/${routeMap[resourceType] || resourceType.toLowerCase()}/${resource.id}`,
			};
		});

		const stats: DashboardStats = {
			patients: {
				total: patients.length,
			},
			appointments: {
				total: appointments.length,
				today: todayAppointments.length,
			},
			practitioners: {
				total: practitioners.length,
			},
			encounters: {
				total: encounters.length,
				recent: recentEncounters.length,
			},
			recentActivity,
		};

		return NextResponse.json(stats);
	} catch (error) {
		console.error("Dashboard Stats API Error:", error);
		return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
	}
}
