"use client";

import { LucideMenu } from "lucide-react";

interface MobileHeaderProps {
	onMenuClick: () => void;
	isMenuOpen: boolean;
}

export function MobileHeader({ onMenuClick, isMenuOpen }: MobileHeaderProps) {
	return (
		<header className={`sticky top-0 z-30 px-4 h-16 flex items-center gap-4 lg:hidden transition-colors ${
			isMenuOpen ? "bg-transparent border-transparent" : "bg-white border-b border-primary-100"
		}`}>
			<button
				onClick={onMenuClick}
				className="p-2 rounded-lg hover:bg-primary-50 transition-colors"
				aria-label="Open navigation menu"
			>
				<LucideMenu className="w-6 h-6 text-primary-900" />
			</button>
			<div>
				<h1 className="text-lg font-semibold text-primary-900">Clinic System</h1>
			</div>
		</header>
	);
}
