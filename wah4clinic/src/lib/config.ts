export const CODESYSTEM_MAP: Record<string, string> = {
	religion: "CodeSystem-religion.json",
	race: "CodeSystem-race.json",
	"educational-attainment": "CodeSystem-educational-attainment.json",
	"indigenous-groups": "CodeSystem-indigenous-groups.json",
	occupation: "CodeSystem-PSOC.json",
};

export const PSGC_LEVELS = ["region", "province", "city", "municipality", "barangay"] as const;

export type PSGCLevel = (typeof PSGC_LEVELS)[number];