import fs from "node:fs";
import path from "node:path";

interface PSGCConcept {
	code: string;
	display: string;
	property: Array<{
		code: string;
		valueString?: string;
		valueCode?: string;
	}>;
}

interface CodeSystemConcept {
	code: string;
	display: string;
}

interface CodeSystem {
	resourceType: string;
	concept: CodeSystemConcept[];
}

interface PSGCCodeSystem {
	resourceType: string;
	concept: PSGCConcept[];
}

class FhirServiceClass {
	private psgcCache: PSGCCodeSystem | null = null;
	private codeSystemCache: Map<string, CodeSystem> = new Map();
	private readonly resourcesPath: string;

	constructor() {
		this.resourcesPath = path.join(process.cwd(), "resources");
	}

	private loadPSGC(): PSGCCodeSystem {
		if (this.psgcCache) {
			return this.psgcCache;
		}

		const filePath = path.join(this.resourcesPath, "CodeSystem-PSGC.json");
		const fileContent = fs.readFileSync(filePath, "utf-8");
		this.psgcCache = JSON.parse(fileContent) as PSGCCodeSystem;

		return this.psgcCache;
	}

	getPSGC(level: string, parentCode?: string): Array<{ code: string; display: string }> {
		const psgc = this.loadPSGC();

		// Normalize level: Treat "city" and "municipality" as interchangeable for retrieval
		// This ensures that when the UI asks for "city" (common for dropdowns), it gets both cities and municipalities.
		let targetLevels = [level];
		if (level === "city" || level === "municipality") {
			targetLevels = ["city", "municipality"];
		}

		// Standard hierarchical filter
		let filtered = psgc.concept.filter((concept) => {
			const levelProp = concept.property.find((p) => p.code === "level");
			return levelProp?.valueString && targetLevels.includes(levelProp.valueString);
		});

		if (parentCode) {
			filtered = filtered.filter((concept) => {
				const parentProp = concept.property.find((p) => p.code === "parent");
				const parent = parentProp?.valueCode;

				// Standard parent match
				if (parent === parentCode) return true;

				// Special Case: Pateros (137606000) has parent 137600000 (District) which might not be exposed.
				// If requesting children of Metro Manila (130000000), include Pateros manually if its parent is the specific district.
				if (parentCode === "130000000" && parent === "137600000") return true;

				return false;
			});
		}

		const results = filtered.map((c) => ({
			code: c.code,
			display: c.display,
		}));

		// HANDLING 1: Independent Cities (HUCs/ICCs) acting as Provinces
		// If requesting provinces for a region, also include direct-child cities (e.g., Isabela City, Cotabato City).
		// NCR (130000000) is excluded: it has no provinces. The UI skips Province and goes Region -> City directly.
		if (level === "province" && parentCode && parentCode !== "130000000") {
			const independentCities = psgc.concept.filter((concept) => {
				const isCity = concept.property.find((p) => p.code === "level")?.valueString === "city";
				const parentMatch = concept.property.find((p) => p.code === "parent")?.valueCode === parentCode;
				return isCity && parentMatch;
			});

			independentCities.forEach((c) => {
				results.push({ code: c.code, display: c.display });
			});
		}

		// HANDLING 2: Self-referential Cities
		// If requesting cities for a "Province" that is actually an Independent City, return the city itself.
		// (e.g., User selects "Isabela City" as province -> City dropdown should show "Isabela City")
		if ((level === "city" || level === "municipality") && parentCode && results.length === 0) {
			const parentAsCity = psgc.concept.find(
				(c) =>
					c.code === parentCode &&
					c.property.find((p) => p.code === "level")?.valueString === "city",
			);

			if (parentAsCity) {
				results.push({ code: parentAsCity.code, display: parentAsCity.display });
			}
		}

		// Final Sort
		results.sort((a, b) => a.display.localeCompare(b.display));

		return results;
	}

	getCodeSystem(name: string): CodeSystemConcept[] {
		if (this.codeSystemCache.has(name)) {
			return this.codeSystemCache.get(name)?.concept || [];
		}

		const codeSystemMap: Record<string, string> = {
			religion: "CodeSystem-religion.json",
			race: "CodeSystem-race.json",
			"educational-attainment": "CodeSystem-educational-attainment.json",
			"indigenous-groups": "CodeSystem-indigenous-groups.json",
			occupation: "CodeSystem-PSOC.json",
			drugs: "CodeSystem-drugs.json",
		};

		const fileName = codeSystemMap[name];
		if (!fileName) {
			throw new Error(`Unknown CodeSystem: ${name}`);
		}

		const filePath = path.join(this.resourcesPath, fileName);
		const fileContent = fs.readFileSync(filePath, "utf-8");
		const codeSystem = JSON.parse(fileContent) as CodeSystem;

		this.codeSystemCache.set(name, codeSystem);

		return codeSystem.concept;
	}

	clearCache(): void {
		this.psgcCache = null;
		this.codeSystemCache.clear();
	}
}

export const FhirService = new FhirServiceClass();