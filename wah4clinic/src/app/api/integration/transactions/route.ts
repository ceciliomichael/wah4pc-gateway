import { NextResponse } from "next/server";
import { IntegrationService } from "@/lib/server/integration-service";

export async function GET() {
	try {
		const transactions = await IntegrationService.getTransactions();
		return NextResponse.json(transactions);
	} catch (error) {
		console.error("Failed to fetch transactions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch transactions" },
			{ status: 500 }
		);
	}
}