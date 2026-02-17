/**
 * Philippines timezone offset in the format required by FHIR
 * Asia/Manila is UTC+08:00 year-round (no DST)
 */
const PHILIPPINES_TZ_OFFSET = "+08:00";

/**
 * Converts HTML5 datetime-local string to FHIR-compliant ISO 8601 datetime with Philippines timezone
 * @param datetimeLocal - Format: "YYYY-MM-DDTHH:mm" (no timezone, no seconds)
 * @returns ISO 8601 string with +08:00 timezone (e.g., "2024-02-15T09:00:00+08:00")
 * 
 * FHIR Requirement: If a date has a time, it MUST have a timezone
 * datetime-local inputs produce "YYYY-MM-DDTHH:mm" which lacks both seconds and timezone
 */
export function toFHIRDateTime(datetimeLocal: string): string {
	if (!datetimeLocal) return "";
	
	// Validate format: must be "YYYY-MM-DDTHH:mm"
	const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
	if (!datetimeRegex.test(datetimeLocal)) {
		console.warn(`Invalid datetime-local format: ${datetimeLocal}`);
		return "";
	}
	
	// Append seconds and Philippines timezone to make it FHIR-compliant
	// "2026-02-04T02:26" → "2026-02-04T02:26:00+08:00"
	return `${datetimeLocal}:00${PHILIPPINES_TZ_OFFSET}`;
}

/**
 * Converts FHIR ISO 8601 datetime to HTML5 datetime-local format
 * @param fhirDateTime - ISO 8601 string (e.g., "2024-02-15T09:00:00+08:00")
 * @returns Format: "YYYY-MM-DDTHH:mm" for datetime-local inputs
 * 
 * This conversion interprets the FHIR datetime in the user's local timezone
 * to display it correctly in the datetime-local input field
 */
export function fromFHIRDateTime(fhirDateTime: string): string {
	if (!fhirDateTime) return "";
	
	try {
		const date = new Date(fhirDateTime);
		
		if (isNaN(date.getTime())) {
			console.warn(`Invalid FHIR datetime: ${fhirDateTime}`);
			return "";
		}
		
		// Extract local date/time components for datetime-local input
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	} catch (error) {
		console.error(`Error parsing FHIR datetime: ${fhirDateTime}`, error);
		return "";
	}
}