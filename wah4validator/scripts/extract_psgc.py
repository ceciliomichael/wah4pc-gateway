import requests
import json

def fetch_psgc_data():
    """Fetch PSGC data from the community API"""
    base_url = "https://psgc.gitlab.io/api"
    
    all_codes = []
    
    # Fetch regions
    print("Fetching regions...")
    regions = requests.get(f"{base_url}/regions.json").json()
    for region in regions:
        all_codes.append({
            "code": region["code"],
            "display": region["name"],
            "level": "region",
            "parent": None
        })
    
    # Fetch provinces
    print("Fetching provinces...")
    provinces = requests.get(f"{base_url}/provinces.json").json()
    for province in provinces:
        all_codes.append({
            "code": province["code"],
            "display": province["name"],
            "level": "province",
            "parent": province["regionCode"]
        })
    
    # Fetch cities and municipalities
    print("Fetching cities/municipalities...")
    cities = requests.get(f"{base_url}/cities.json").json()
    for city in cities:
        all_codes.append({
            "code": city["code"],
            "display": city["name"],
            "level": "city",
            "parent": city.get("provinceCode") or city.get("regionCode")
        })
    
    municipalities = requests.get(f"{base_url}/municipalities.json").json()
    for muni in municipalities:
        all_codes.append({
            "code": muni["code"],
            "display": muni["name"],
            "level": "municipality",
            "parent": muni.get("provinceCode") or muni.get("districtCode")
        })
    
    # Fetch barangays (this is the largest dataset)
    print("Fetching barangays (this may take a moment)...")
    barangays = requests.get(f"{base_url}/barangays.json").json()
    for brgy in barangays:
        all_codes.append({
            "code": brgy["code"],
            "display": brgy["name"],
            "level": "barangay",
            "parent": brgy.get("cityCode") or brgy.get("municipalityCode") or brgy.get("subMunicipalityCode")
        })
    
    print(f"\nTotal codes fetched: {len(all_codes)}")
    print(f"  Regions: {len(regions)}")
    print(f"  Provinces: {len(provinces)}")
    print(f"  Cities: {len(cities)}")
    print(f"  Municipalities: {len(municipalities)}")
    print(f"  Barangays: {len(barangays)}")
    
    return all_codes

def generate_codesystem(codes):
    """Generate FHIR CodeSystem from PSGC data"""
    codesystem = {
        "resourceType": "CodeSystem",
        "id": "PSGC",
        "url": "http://psa.gov.ph/fhir/CodeSystem/PSGC",
        "version": "2024",
        "name": "PSGC",
        "title": "Philippine Standard Geographic Code",
        "status": "active",
        "experimental": False,
        "date": "2024-01-01",
        "publisher": "Philippine Statistics Authority",
        "description": "The Philippine Standard Geographic Code (PSGC) is a systematic classification and coding of geographic areas in the Philippines. It is based on the four (4) well-established hierarchical levels of geographical-political subdivisions of the country, namely: the region, the province, the municipality/city, and the barangay.",
        "caseSensitive": True,
        "hierarchyMeaning": "is-a",
        "content": "complete",
        "property": [
            {
                "code": "level",
                "description": "Geographic level (region, province, city, municipality, barangay)",
                "type": "string"
            },
            {
                "code": "parent",
                "description": "Parent geographic code",
                "type": "code"
            }
        ],
        "concept": []
    }
    
    for code_entry in codes:
        concept = {
            "code": code_entry["code"],
            "display": code_entry["display"],
            "property": [
                {"code": "level", "valueString": code_entry["level"]}
            ]
        }
        if code_entry["parent"]:
            concept["property"].append({"code": "parent", "valueCode": code_entry["parent"]})
        
        codesystem["concept"].append(concept)
    
    return codesystem

def generate_valuesets(codes):
    """Generate ValueSets for each geographic level"""
    levels = {
        "region": {
            "id": "regions",
            "name": "Regions",
            "title": "Philippine Regions",
            "description": "All regions in the Philippines"
        },
        "province": {
            "id": "provinces", 
            "name": "Provinces",
            "title": "Philippine Provinces",
            "description": "All provinces in the Philippines"
        },
        "city": {
            "id": "cities",
            "name": "Cities",
            "title": "Philippine Cities",
            "description": "All cities in the Philippines"
        },
        "municipality": {
            "id": "municipalities",
            "name": "Municipalities", 
            "title": "Philippine Municipalities",
            "description": "All municipalities in the Philippines"
        },
        "barangay": {
            "id": "barangays",
            "name": "Barangays",
            "title": "Philippine Barangays",
            "description": "All barangays in the Philippines"
        }
    }
    
    valuesets = []
    
    for level, info in levels.items():
        level_codes = [c for c in codes if c["level"] == level]
        
        valueset = {
            "resourceType": "ValueSet",
            "id": info["id"],
            "url": f"http://psa.gov.ph/fhir/ValueSet/{info['id']}",
            "version": "2024",
            "name": info["name"],
            "title": info["title"],
            "status": "active",
            "experimental": False,
            "date": "2024-01-01",
            "publisher": "Philippine Statistics Authority",
            "description": info["description"],
            "compose": {
                "include": [
                    {
                        "system": "http://psa.gov.ph/fhir/CodeSystem/PSGC",
                        "filter": [
                            {
                                "property": "level",
                                "op": "=",
                                "value": level
                            }
                        ]
                    }
                ]
            }
        }
        valuesets.append((info["id"], valueset))
    
    return valuesets

def main():
    print("=" * 60)
    print("PSGC Data Extraction for FHIR")
    print("=" * 60)
    
    # Fetch data
    codes = fetch_psgc_data()
    
    # Generate CodeSystem
    print("\nGenerating CodeSystem...")
    codesystem = generate_codesystem(codes)
    
    with open("resources/CodeSystem-PSGC.json", "w", encoding="utf-8") as f:
        json.dump(codesystem, f, indent=2, ensure_ascii=False)
    print(f"Generated resources/CodeSystem-PSGC.json with {len(codesystem['concept'])} concepts")
    
    # Generate ValueSets
    print("\nGenerating ValueSets...")
    valuesets = generate_valuesets(codes)
    
    for vs_id, vs in valuesets:
        filename = f"resources/ValueSet-{vs_id}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(vs, f, indent=2, ensure_ascii=False)
        print(f"Generated {filename}")
    
    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)

if __name__ == "__main__":
    main()