import json

def get_prop(concept, prop_name):
    """Get property value from concept, handling different value types"""
    for p in concept.get('property', []):
        if p.get('code') == prop_name:
            return p.get('valueString') or p.get('valueCode') or p.get('valueBoolean') or ''
    return ''

# Load PSGC CodeSystem
with open('resources/CodeSystem-PSGC.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find NCR related codes
print("=== NCR Region ===")
for c in data['concept']:
    if c['code'] == '130000000':
        print(f"Region: {c['code']}: {c['display']}")
        break

print("\n=== All NCR codes (first 50) ===")
count = 0
for c in data['concept']:
    if c['code'].startswith('13'):
        level = get_prop(c, 'level')
        print(f"  {c['code']}: {c['display']} ({level})")
        count += 1
        if count > 50:
            break

print("\n=== Looking for Manila codes ===")
for c in data['concept']:
    if 'manila' in c['display'].lower():
        level = get_prop(c, 'level')
        print(f"  {c['code']}: {c['display']} ({level})")

print("\n=== Looking for Ermita ===")
for c in data['concept']:
    if 'ermita' in c['display'].lower():
        level = get_prop(c, 'level')
        print(f"  {c['code']}: {c['display']} ({level})")

print("\n=== PSOC Code 2221 ===")
with open('resources/CodeSystem-PSOC.json', 'r', encoding='utf-8') as f:
    psoc = json.load(f)
    
for c in psoc['concept']:
    if c['code'] == '2221':
        print(f"  {c['code']}: {c['display']}")
        break

print("\n=== Medical doctor codes in PSOC ===")
for c in psoc['concept']:
    if 'medical' in c['display'].lower() or 'doctor' in c['display'].lower() or 'physician' in c['display'].lower():
        print(f"  {c['code']}: {c['display']}")