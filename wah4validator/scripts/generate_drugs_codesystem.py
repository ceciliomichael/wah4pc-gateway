#!/usr/bin/env python3
"""
Generate FHIR CodeSystem for PH FDA Drug Products.

Parses ALL_DrugProducts.csv and creates a FHIR R4 CodeSystem resource
with all registered drug products from the Philippine FDA.
"""

import csv
import json
import re
import sys
from pathlib import Path
from typing import Any


def sanitize_code(registration_number: str) -> str:
    """
    Convert registration number to a valid FHIR code.
    FHIR codes should be lowercase with allowed characters.
    """
    # Keep alphanumeric and hyphens, convert to lowercase
    code = re.sub(r'[^a-zA-Z0-9\-]', '-', registration_number.strip())
    return code.lower()


def clean_text(text: str) -> str:
    """Clean text by removing extra whitespace and newlines."""
    if not text:
        return ""
    # Replace newlines and multiple spaces with single space
    cleaned = re.sub(r'\s+', ' ', text.strip())
    return cleaned


def build_display_name(row: dict[str, str]) -> str:
    """
    Build a human-readable display name from drug information.
    Format: "Brand Name (Generic Name) Dosage Strength Dosage Form"
    """
    parts = []
    
    brand = clean_text(row.get("Brand Name", ""))
    generic = clean_text(row.get("Generic Name", ""))
    strength = clean_text(row.get("Dosage Strength", ""))
    form = clean_text(row.get("Dosage Form", ""))
    
    if brand:
        if generic:
            parts.append(f"{brand} ({generic})")
        else:
            parts.append(brand)
    elif generic:
        parts.append(generic)
    
    if strength:
        parts.append(strength)
    
    if form:
        parts.append(form)
    
    return " - ".join(parts) if parts else "Unknown Drug"


def build_concept(row: dict[str, str]) -> dict[str, Any]:
    """Build a FHIR CodeSystem concept from a CSV row."""
    reg_number = row.get("Registration Number", "").strip()
    if not reg_number:
        return None
    
    code = sanitize_code(reg_number)
    display = build_display_name(row)
    
    concept: dict[str, Any] = {
        "code": code,
        "display": display
    }
    
    # Add properties as designation/properties
    properties = []
    
    # Registration number (original)
    if reg_number:
        properties.append({
            "code": "registration-number",
            "valueString": reg_number
        })
    
    # Generic name
    generic = clean_text(row.get("Generic Name", ""))
    if generic:
        properties.append({
            "code": "generic-name",
            "valueString": generic
        })
    
    # Brand name
    brand = clean_text(row.get("Brand Name", ""))
    if brand:
        properties.append({
            "code": "brand-name",
            "valueString": brand
        })
    
    # Dosage strength
    strength = clean_text(row.get("Dosage Strength", ""))
    if strength:
        properties.append({
            "code": "dosage-strength",
            "valueString": strength
        })
    
    # Dosage form
    form = clean_text(row.get("Dosage Form", ""))
    if form:
        properties.append({
            "code": "dosage-form",
            "valueString": form
        })
    
    # Classification
    classification = clean_text(row.get("Classification", ""))
    if classification:
        properties.append({
            "code": "classification",
            "valueString": classification
        })
    
    # Pharmacologic category
    category = clean_text(row.get("Pharmacologic Category", ""))
    if category:
        properties.append({
            "code": "pharmacologic-category",
            "valueString": category
        })
    
    # Manufacturer
    manufacturer = clean_text(row.get("Manufacturer", ""))
    if manufacturer:
        properties.append({
            "code": "manufacturer",
            "valueString": manufacturer
        })
    
    # Country of origin
    country = clean_text(row.get("Country of Origin", ""))
    if country:
        properties.append({
            "code": "country-of-origin",
            "valueString": country
        })
    
    if properties:
        concept["property"] = properties
    
    return concept


def generate_codesystem(csv_path: Path) -> dict[str, Any]:
    """Generate FHIR CodeSystem from CSV file."""
    concepts = []
    seen_codes = set()
    skipped = 0
    duplicates = 0
    
    with open(csv_path, 'r', encoding='utf-8', errors='replace') as f:
        # Handle multi-line fields in CSV
        reader = csv.DictReader(f)
        
        for row in reader:
            concept = build_concept(row)
            if concept is None:
                skipped += 1
                continue
            
            # Skip duplicates
            if concept["code"] in seen_codes:
                duplicates += 1
                continue
            
            seen_codes.add(concept["code"])
            concepts.append(concept)
    
    print(f"Processed {len(concepts)} drug products")
    print(f"Skipped {skipped} rows (no registration number)")
    print(f"Skipped {duplicates} duplicates")
    
    codesystem = {
        "resourceType": "CodeSystem",
        "id": "drugs",
        "url": "urn://example.com/ph-core/fhir/CodeSystem/drugs",
        "version": "1.0.0",
        "name": "PHFDADrugProducts",
        "title": "Philippine FDA Drug Products",
        "status": "active",
        "experimental": False,
        "date": "2025-01-17",
        "publisher": "Philippine FDA",
        "description": "CodeSystem containing all registered drug products from the Philippine Food and Drug Administration (FDA). Source: https://verification.fda.gov.ph",
        "caseSensitive": True,
        "content": "complete",
        "count": len(concepts),
        "property": [
            {
                "code": "registration-number",
                "description": "FDA Registration Number",
                "type": "string"
            },
            {
                "code": "generic-name",
                "description": "Generic/Chemical Name",
                "type": "string"
            },
            {
                "code": "brand-name",
                "description": "Brand/Trade Name",
                "type": "string"
            },
            {
                "code": "dosage-strength",
                "description": "Dosage Strength",
                "type": "string"
            },
            {
                "code": "dosage-form",
                "description": "Dosage Form",
                "type": "string"
            },
            {
                "code": "classification",
                "description": "Drug Classification (RX, OTC, etc.)",
                "type": "string"
            },
            {
                "code": "pharmacologic-category",
                "description": "Pharmacologic Category",
                "type": "string"
            },
            {
                "code": "manufacturer",
                "description": "Manufacturer Name",
                "type": "string"
            },
            {
                "code": "country-of-origin",
                "description": "Country of Origin",
                "type": "string"
            }
        ],
        "concept": concepts
    }
    
    return codesystem


def generate_valueset() -> dict[str, Any]:
    """Generate FHIR ValueSet that includes all drugs from the CodeSystem."""
    return {
        "resourceType": "ValueSet",
        "id": "drugs",
        "url": "urn://example.com/ph-core/fhir/ValueSet/drugs",
        "version": "1.0.0",
        "name": "PHFDADrugs",
        "title": "Philippine FDA Drugs",
        "status": "active",
        "experimental": False,
        "date": "2025-01-17",
        "publisher": "Philippine FDA",
        "description": "ValueSet containing all registered drug products from the Philippine Food and Drug Administration (FDA).",
        "compose": {
            "include": [
                {
                    "system": "urn://example.com/ph-core/fhir/CodeSystem/drugs"
                }
            ]
        }
    }


def main():
    """Main entry point."""
    # Determine paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    csv_path = project_root / "ALL_DrugProducts.csv"
    codesystem_path = project_root / "resources" / "CodeSystem-drugs.json"
    valueset_path = project_root / "resources" / "ValueSet-drugs.json"
    
    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)
    
    print(f"Reading CSV from: {csv_path}")
    
    # Generate CodeSystem
    print("\nGenerating CodeSystem...")
    codesystem = generate_codesystem(csv_path)
    
    with open(codesystem_path, 'w', encoding='utf-8') as f:
        json.dump(codesystem, f, indent=2, ensure_ascii=False)
    print(f"CodeSystem written to: {codesystem_path}")
    
    # Generate ValueSet
    print("\nGenerating ValueSet...")
    valueset = generate_valueset()
    
    with open(valueset_path, 'w', encoding='utf-8') as f:
        json.dump(valueset, f, indent=2, ensure_ascii=False)
    print(f"ValueSet written to: {valueset_path}")
    
    print("\nDone!")


if __name__ == "__main__":
    main()