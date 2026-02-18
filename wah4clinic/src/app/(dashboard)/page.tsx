import Link from "next/link";
import { LucideUsers, LucideCalendar, LucideUserCog, LucideFileText, LucidePlus, LucideActivity } from "lucide-react";

interface DashboardStats {
	totalPatients: number;
	appointmentsToday: number;
	activePractitioners: number;
	recentEncounters: number;
}

interface RecentActivity {
	id: string;
	resourceType: string;
	description: string;
	timestamp: string;
	href: string;
}

interface DashboardData {
	stats: DashboardStats;
	recentActivity: RecentActivity[];
}

async function getDashboardData(): Promise<DashboardData> {
	try {
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
		const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
			cache: "no-store",
		});
		
		if (!response.ok) {
			throw new Error("Failed to fetch dashboard data");
		}
		
		return response.json();
	} catch (error) {
		console.error("Dashboard data fetch error:", error);
		return {
			stats: {
				totalPatients: 0,
				appointmentsToday: 0,
				activePractitioners: 0,
				recentEncounters: 0,
			},
			recentActivity: [],
		};
	}
}

interface StatCardProps {
	title: string;
	value: number;
	icon: React.ComponentType<{ className?: string }>;
	href: string;
}

function StatCard({ title, value, icon: Icon, href }: StatCardProps) {
	return (
		<Link
			href={href}
			className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 hover:shadow-md transition-shadow"
		>
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-stone-600 mb-1">{title}</p>
					<p className="text-3xl font-semibold text-stone-900">{value}</p>
				</div>
				<div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
					<Icon className="w-6 h-6 text-amber-600" />
				</div>
			</div>
		</Link>
	);
}

interface QuickActionProps {
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	href: string;
}

function QuickAction({ title, description, icon: Icon, href }: QuickActionProps) {
	return (
		<Link
			href={href}
			className="flex items-start gap-4 p-4 rounded-xl bg-white border border-stone-100 hover:bg-stone-50 transition-colors"
		>
			<div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
				<Icon className="w-5 h-5 text-stone-700" />
			</div>
			<div>
				<h3 className="font-medium text-stone-900 mb-1">{title}</h3>
				<p className="text-sm text-stone-600">{description}</p>
			</div>
		</Link>
	);
}

function getResourceTypeLabel(resourceType: string): string {
	const labels: Record<string, string> = {
		Patient: "Patient",
		Appointment: "Appointment",
		Practitioner: "Practitioner",
		Encounter: "Encounter",
		Observation: "Observation",
		Medication: "Medication",
		MedicationRequest: "Medication Request",
		Immunization: "Immunization",
		Procedure: "Procedure",
		DiagnosticReport: "Diagnostic Report",
	};
	return labels[resourceType] || resourceType;
}

function formatTimestamp(timestamp: string): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}

interface ActivityItemProps {
	activity: RecentActivity;
}

function ActivityItem({ activity }: ActivityItemProps) {
	return (
		<Link
			href={activity.href}
			className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors"
		>
			<div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
				<LucideActivity className="w-4 h-4 text-stone-600" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-stone-900 truncate">
					{activity.description}
				</p>
				<p className="text-xs text-stone-500">
					{getResourceTypeLabel(activity.resourceType)} • {formatTimestamp(activity.timestamp)}
				</p>
			</div>
		</Link>
	);
}

export default async function DashboardPage() {
	const { stats, recentActivity } = await getDashboardData();

	return (
		<div className="p-4 lg:p-8">
			<div className="mb-8">
				<h1 className="text-3xl font-semibold text-stone-900 mb-2">Dashboard</h1>
				<p className="text-stone-600">Welcome to your clinic management system</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<StatCard
					title="Total Patients"
					value={stats.totalPatients}
					icon={LucideUsers}
					href="/patients"
				/>
				<StatCard
					title="Appointments Today"
					value={stats.appointmentsToday}
					icon={LucideCalendar}
					href="/appointments"
				/>
				<StatCard
					title="Active Practitioners"
					value={stats.activePractitioners}
					icon={LucideUserCog}
					href="/practitioners"
				/>
				<StatCard
					title="Recent Encounters"
					value={stats.recentEncounters}
					icon={LucideFileText}
					href="/encounters"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<section>
					<h2 className="text-xl font-semibold text-stone-900 mb-4">Quick Actions</h2>
					<div className="space-y-3">
						<QuickAction
							title="Register New Patient"
							description="Add a new patient to the system"
							icon={LucidePlus}
							href="/patients/new"
						/>
						<QuickAction
							title="Schedule Appointment"
							description="Book a new appointment"
							icon={LucideCalendar}
							href="/appointments/new"
						/>
						<QuickAction
							title="Add Practitioner"
							description="Register a new healthcare provider"
							icon={LucideUserCog}
							href="/practitioners/new"
						/>
						<QuickAction
							title="Record Encounter"
							description="Document a patient visit"
							icon={LucideFileText}
							href="/encounters/new"
						/>
					</div>
				</section>

				<section>
					<h2 className="text-xl font-semibold text-stone-900 mb-4">Recent Activity</h2>
					<div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
						{recentActivity.length > 0 ? (
							<div className="divide-y divide-stone-100">
								{recentActivity.map((activity) => (
									<ActivityItem key={activity.id} activity={activity} />
								))}
							</div>
						) : (
							<p className="text-center text-stone-500 py-8">No recent activity to display</p>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
