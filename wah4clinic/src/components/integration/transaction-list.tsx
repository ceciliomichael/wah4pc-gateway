"use client";

import { WebhookTransaction, TransactionStatus } from "@/lib/integration-types";
import { LucideCheckCircle2, LucideXCircle, LucideAlertTriangle, LucideClock } from "lucide-react";

interface TransactionListProps {
	transactions: WebhookTransaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
	const getStatusIcon = (status: TransactionStatus) => {
		switch (status) {
			case TransactionStatus.SUCCESS:
				return <LucideCheckCircle2 className="w-3.5 h-3.5" />;
			case TransactionStatus.REJECTED:
				return <LucideXCircle className="w-3.5 h-3.5" />;
			case TransactionStatus.ERROR:
				return <LucideAlertTriangle className="w-3.5 h-3.5" />;
			case TransactionStatus.PENDING:
				return <LucideClock className="w-3.5 h-3.5" />;
			default:
				return null;
		}
	};

	const getStatusColor = (status: TransactionStatus) => {
		switch (status) {
			case TransactionStatus.SUCCESS:
				return "bg-green-100 text-green-800";
			case TransactionStatus.REJECTED:
				return "bg-red-100 text-red-800";
			case TransactionStatus.ERROR:
				return "bg-yellow-100 text-yellow-800";
			case TransactionStatus.PENDING:
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="space-y-4">
			{transactions.length === 0 ? (
				<div className="text-center py-8 text-stone-500">
					No transactions yet. Your system will log all incoming webhook requests here.
				</div>
			) : (
				<div className="space-y-3">
					{transactions.slice(0, 10).map((tx) => (
						<div
							key={tx.id}
							className="bg-white rounded-xl border border-stone-200 p-4 hover:shadow-md transition-shadow"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<span className="font-medium text-stone-900">
											{tx.type} Request
										</span>
										<span
											className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
												tx.status,
											)}`}
										>
											{getStatusIcon(tx.status)}
											{tx.status}
										</span>
									</div>
									<div className="text-sm text-stone-600 space-y-1">
										<p>Transaction ID: {tx.details.transactionId}</p>
										{tx.details.identifiers && (
											<p>
												Identifiers:{" "}
												{tx.details.identifiers
													.map((id) => `${id.system.split("/").pop()}: ${id.value}`)
													.join(", ")}
											</p>
										)}
										{tx.error && <p className="text-red-600">Error: {tx.error}</p>}
									</div>
								</div>
								<div className="text-right text-xs text-stone-500">
									{new Date(tx.timestamp).toLocaleString()}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}