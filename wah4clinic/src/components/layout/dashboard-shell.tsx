"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { MobileHeader } from "./mobile-header";

interface DashboardShellProps {
	children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const pathname = usePathname();

	// Close sidebar on navigation
	useEffect(() => {
		setIsSidebarOpen(false);
	}, [pathname]);

	return (
		<div className="flex min-h-screen bg-stone-50 text-stone-900">
			<Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
			<div className="flex-1 flex flex-col min-w-0">
				<MobileHeader onMenuClick={() => setIsSidebarOpen(true)} isMenuOpen={isSidebarOpen} />
				<main className="flex-1">{children}</main>
			</div>
		</div>
	);
}
