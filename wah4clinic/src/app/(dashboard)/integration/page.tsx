"use client";

import { TransactionList } from "@/components/integration/transaction-list";
import { WebhookTransaction } from "@/lib/integration-types";
import { useEffect, useState } from "react";
import { LucideRefreshCw } from "lucide-react";

export default function IntegrationPage() {
	const [transactions, setTransactions] = useState<WebhookTransaction[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

	const fetchTransactions = async () => {
		try {
			const response = await fetch("/api/integration/transactions");
			if (response.ok) {
				const data = await response.json();
				setTransactions(data);
				setLastUpdate(new Date());
			}
		} catch (error) {
			console.error("Failed to fetch transactions:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchTransactions();
		const interval = setInterval(fetchTransactions, 5000);
		return () => clearInterval(interval);
	}, []);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-stone-50 flex items-center justify-center">
				<div className="text-center">
					<LucideRefreshCw className="w-8 h-8 text-stone-400 animate-spin mx-auto mb-2" />
					<p className="text-stone-600">Loading transactions...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-stone-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-stone-900">Integration Dashboard</h1>
							<p className="mt-2 text-lg text-stone-600">
								Monitor all incoming webhook requests and data exchanges with the WAH4PC Gateway.
							</p>
						</div>
						<div className="flex items-center gap-2 text-sm text-stone-500">
							<LucideRefreshCw className="w-4 h-4 animate-spin" />
							<span>Auto-refreshing every 5s</span>
							<span className="text-stone-400">•</span>
							<span>Last update: {lastUpdate.toLocaleTimeString()}</span>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white rounded-xl border border-stone-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-stone-600">Total Requests</p>
								<p className="text-3xl font-bold text-stone-900">{transactions.length}</p>
							</div>
							<div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="lucide lucide-network w-6 h-6 text-secondary-600"
								>
									<rect width="16" height="16" x="4" y="4" rx="2" />
									<circle cx="12" cy="12" r="3" />
									<path d="M12 8v8" />
									<path d="M8 12h8" />
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl border border-stone-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-stone-600">Successful</p>
								<p className="text-3xl font-bold text-stone-900">
									{transactions.filter((tx) => tx.status === "SUCCESS").length}
								</p>
							</div>
							<div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="lucide lucide-check-circle-2 w-6 h-6 text-secondary-600"
								>
									<circle cx="12" cy="12" r="10" />
									<path d="m9 12 2 2 4-4" />
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl border border-stone-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-stone-600">Rejected</p>
								<p className="text-3xl font-bold text-stone-900">
									{transactions.filter((tx) => tx.status === "REJECTED").length}
								</p>
							</div>
							<div className="w-12 h-12 bg-tertiary-100 rounded-full flex items-center justify-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="lucide lucide-x-circle w-6 h-6 text-tertiary-600"
								>
									<circle cx="12" cy="12" r="10" />
									<path d="m15 9-6 6" />
									<path d="m9 9 6 6" />
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl border border-stone-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-stone-600">Errors</p>
								<p className="text-3xl font-bold text-stone-900">
									{transactions.filter((tx) => tx.status === "ERROR").length}
								</p>
							</div>
							<div className="w-12 h-12 bg-tertiary-100 rounded-full flex items-center justify-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="lucide lucide-alert-triangle w-6 h-6 text-tertiary-600"
								>
									<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
									<path d="M12 9v4" />
									<path d="M12 17h.01" />
								</svg>
							</div>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl border border-stone-200 p-6">
					<h2 className="text-xl font-semibold text-stone-900 mb-4">Recent Transactions</h2>
					<TransactionList transactions={transactions} />
				</div>
			</div>
		</div>
	);
}