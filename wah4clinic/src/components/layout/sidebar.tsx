"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideHome, LucideUsers, LucideCalendar, LucideUserCog, LucideFileText, LucideNetwork, LucidePill, LucideActivity, LucideSyringe, LucideHeartPulse, LucideX } from "lucide-react";

interface NavItem {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
	{
		label: "Dashboard",
		href: "/",
		icon: LucideHome,
	},
	{
		label: "Patients",
		href: "/patients",
		icon: LucideUsers,
	},
	{
		label: "Appointments",
		href: "/appointments",
		icon: LucideCalendar,
	},
	{
		label: "Practitioners",
		href: "/practitioners",
		icon: LucideUserCog,
	},
	{
		label: "Encounters",
		href: "/encounters",
		icon: LucideFileText,
	},
	{
		label: "Medications",
		href: "/medications",
		icon: LucidePill,
	},
	{
		label: "Medication Requests",
		href: "/medication-requests",
		icon: LucidePill,
	},
	{
		label: "Procedures",
		href: "/procedures",
		icon: LucideActivity,
	},
	{
		label: "Immunizations",
		href: "/immunizations",
		icon: LucideSyringe,
	},
	{
		label: "Observations",
		href: "/observations",
		icon: LucideHeartPulse,
	},
	{
		label: "Diagnostic Reports",
		href: "/diagnostic-reports",
		icon: LucideFileText,
	},
	{
		label: "Integration",
		href: "/integration",
		icon: LucideNetwork,
	},
];

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
	const pathname = usePathname();

	const isActive = (href: string) => {
		if (href === "/") {
			return pathname === "/";
		}
		return pathname.startsWith(href);
	};

	return (
		<>
			{/* Backdrop overlay for mobile */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-30 lg:hidden"
					onClick={onClose}
					aria-hidden="true"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`
				fixed inset-y-0 left-0 z-40 w-64 bg-stone-900 text-white flex flex-col
				transform transition-transform duration-300 ease-in-out
				${isOpen ? "translate-x-0" : "-translate-x-full"}
				lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
				`}
			>
				{/* Mobile close button */}
				<div className="lg:hidden flex items-center justify-between p-6 border-b border-stone-800">
					<div>
						<h1 className="text-2xl font-semibold">Clinic System</h1>
						<p className="text-sm text-stone-400 mt-1">PH Core FHIR</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-stone-800 transition-colors"
						aria-label="Close navigation menu"
					>
						<LucideX className="w-6 h-6" />
					</button>
				</div>

				{/* Desktop header */}
				<div className="hidden lg:block p-6 border-b border-stone-800">
					<h1 className="text-2xl font-semibold">Clinic System</h1>
					<p className="text-sm text-stone-400 mt-1">PH Core FHIR</p>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					<ul className="space-y-2">
						{navItems.map((item) => {
							const Icon = item.icon;
							const active = isActive(item.href);

							return (
								<li key={item.href}>
									<Link
										href={item.href}
										onClick={onClose}
										className={`
											flex items-center gap-3 px-4 py-3 rounded-xl transition-all
											${
												active
													? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
													: "text-stone-300 hover:bg-stone-800 hover:text-white"
											}
										`}
									>
										<Icon className="w-5 h-5" />
										<span className="font-medium">{item.label}</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>

				<div className="p-4 border-t border-stone-800">
					<div className="px-4 py-3 rounded-xl bg-stone-800">
						<p className="text-sm font-medium text-stone-200">System Status</p>
						<p className="text-xs text-stone-400 mt-1">All services operational</p>
					</div>
				</div>
			</aside>
		</>
	);
}
