import { type NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/server/data-service";

interface PractitionerName {
  prefix?: string[];
  family?: string;
  given?: string[];
}

interface PractitionerResource {
  id: string;
  active?: boolean;
  name?: PractitionerName[];
  [key: string]: unknown;
}

interface GatewayPractitionerItem {
  code: string;
  display: string;
  active: boolean;
}

function buildPractitionerDisplayName(
  practitioner: PractitionerResource,
): string {
  const name = practitioner.name?.[0];
  if (!name) {
    return practitioner.id;
  }

  const segments = [
    name.prefix?.[0]?.trim() || "",
    name.given?.join(" ").trim() || "",
    (name.family || "").trim(),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return segments || practitioner.id;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("X-Gateway-Auth");
    const expectedKey = process.env.GATEWAY_AUTH_KEY;

    if (expectedKey && authHeader !== expectedKey) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid gateway authentication" },
        { status: 401 },
      );
    }

    const practitioners =
      DataService.findAll<PractitionerResource>("Practitioner");
    const payload: GatewayPractitionerItem[] = practitioners.map(
      (practitioner) => ({
        code: practitioner.id,
        display: buildPractitionerDisplayName(practitioner),
        active: practitioner.active !== false,
      }),
    );

    return NextResponse.json(payload);
  } catch (error) {
    console.error("FHIR Practitioner List API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch practitioner list" },
      { status: 500 },
    );
  }
}
