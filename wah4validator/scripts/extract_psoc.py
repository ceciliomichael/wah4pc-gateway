import pandas as pd
import json
import re
import math

def is_valid_number(val):
    """Check if value is a valid number (not NaN)"""
    if val is None:
        return False
    if isinstance(val, float) and math.isnan(val):
        return False
    if isinstance(val, str) and val.strip() == '':
        return False
    return True

def clean_code(val):
    """Clean and format code value"""
    if not is_valid_number(val):
        return None
    if isinstance(val, float):
        return str(int(val))
    return str(val).strip()

def clean_text(val):
    """Clean text value"""
    if not is_valid_number(val):
        return None
    return str(val).strip()

def extract_group0_occupations(df):
    """Special extraction for Group 0 (Armed Forces) which has different structure"""
    occupations = []
    
    sub_major_col = 'SUB-MAJOR\nGROUP'
    minor_col = 'MINOR\nGROUP'
    unit_col = 'UNIT\nGROUP'
    title_col = 'OCCUPATIONAL TITLES AND DEFINITIONS'
    
    i = 0
    while i < len(df):
        row = df.iloc[i]
        
        sub_major = clean_code(row[sub_major_col])
        minor = clean_code(row[minor_col])
        unit = clean_code(row[unit_col])
        title = clean_text(row[title_col])
        
        # Group 0 has combined rows like: sub_major=1, minor=11, unit=110, title="COMMISSIONED ARMED FORCES OFFICERS"
        if sub_major and minor and unit:
            # This is a unit group row
            unit_code = clean_code(unit)
            
            # Find the title - it should be on same row or check if it's a valid title
            unit_title = None
            if title and 'Major Group' not in title and len(title) > 5:
                unit_title = title
            else:
                # Look in next rows for title
                for j in range(i+1, min(i+5, len(df))):
                    next_title = clean_text(df.iloc[j][title_col])
                    if next_title and not next_title.startswith('Tasks') and not next_title.startswith('Examples') and len(next_title) > 5:
                        unit_title = next_title
                        break
            
            # Add sub-major if not already added (1 digit for Group 0)
            sub_major_code = clean_code(sub_major)
            
            # Add minor group (2 digits for Group 0)
            minor_code = clean_code(minor)
            
            # For Group 0, the hierarchy is:
            # Sub-major: 01, 02, 03 (we'll store as "01", "02", "03")
            # Minor: 011, 021, 031 (we'll store as "011", "021", "031")  
            # Unit: 0110, 0210, 0310 (we'll store as "0110", "0210", "0310")
            
            # Pad codes with leading zero for Group 0
            sub_major_padded = f"0{sub_major_code}"
            minor_padded = f"0{minor_code}"
            unit_padded = f"0{unit_code}"
            
            occupations.append({
                'code': unit_padded,
                'display': unit_title or f"Armed Forces Unit Group {unit_padded}",
                'level': 'unit',
                'parent': minor_padded
            })
        
        i += 1
    
    # Now add the sub-major and minor groups based on what we found
    seen_sub_major = set()
    seen_minor = set()
    
    for occ in occupations:
        if occ['level'] == 'unit':
            # Extract sub-major (first 2 digits) and minor (first 3 digits)
            sub_major_code = occ['code'][:2]
            minor_code = occ['code'][:3]
            
            if sub_major_code not in seen_sub_major:
                seen_sub_major.add(sub_major_code)
            if minor_code not in seen_minor:
                seen_minor.add(minor_code)
    
    # Define Group 0 sub-major groups
    sub_major_titles = {
        '01': 'Commissioned Armed Forces Officers',
        '02': 'Non-commissioned Armed Forces Officers', 
        '03': 'Armed Forces Occupations, Other Ranks'
    }
    
    minor_titles = {
        '011': 'Commissioned Armed Forces Officers',
        '021': 'Non-commissioned Armed Forces Officers',
        '031': 'Armed Forces Occupations, Other Ranks'
    }
    
    result = []
    
    # Add sub-major groups
    for code in sorted(seen_sub_major):
        result.append({
            'code': code,
            'display': sub_major_titles.get(code, f"Armed Forces Sub-Major Group {code}"),
            'level': 'sub-major',
            'parent': '0'
        })
    
    # Add minor groups
    for code in sorted(seen_minor):
        result.append({
            'code': code,
            'display': minor_titles.get(code, f"Armed Forces Minor Group {code}"),
            'level': 'minor',
            'parent': code[:2]
        })
    
    # Add unit groups
    result.extend(occupations)
    
    return result

def extract_occupations_from_sheet(df, major_group_num):
    """Extract occupation codes from a single sheet"""
    occupations = []
    
    # Column names (handling newlines in headers)
    sub_major_col = 'SUB-MAJOR\nGROUP'
    minor_col = 'MINOR\nGROUP'
    unit_col = 'UNIT\nGROUP'
    title_col = 'OCCUPATIONAL TITLES AND DEFINITIONS'
    
    current_sub_major = None
    current_sub_major_title = None
    current_minor = None
    current_minor_title = None
    
    i = 0
    while i < len(df):
        row = df.iloc[i]
        
        sub_major = clean_code(row[sub_major_col])
        minor = clean_code(row[minor_col])
        unit = clean_code(row[unit_col])
        title = clean_text(row[title_col])
        
        # Check for Major Group title (e.g., "Major Group 1", "MANAGERS")
        if title and 'Major Group' in str(title):
            i += 1
            continue
            
        # Sub-Major Group (2 digits, e.g., 11, 21)
        if sub_major and len(sub_major) == 2:
            current_sub_major = sub_major
            # Get title from next non-empty row
            for j in range(i+1, min(i+5, len(df))):
                next_title = clean_text(df.iloc[j][title_col])
                if next_title and not next_title.startswith('Tasks') and len(next_title) > 3:
                    current_sub_major_title = next_title
                    break
            
            occupations.append({
                'code': current_sub_major,
                'display': current_sub_major_title or f"Sub-Major Group {current_sub_major}",
                'level': 'sub-major',
                'parent': str(major_group_num)
            })
            i += 1
            continue
        
        # Minor Group (3-4 digits, e.g., 111, 211)
        if minor and len(minor) >= 3:
            current_minor = minor
            # Get title - check if it's on same row or next row
            if unit:
                # Combined minor+unit row
                current_minor_title = title
            else:
                # Look for title in next rows
                for j in range(i+1, min(i+5, len(df))):
                    next_title = clean_text(df.iloc[j][title_col])
                    if next_title and not next_title.startswith('Tasks') and not next_title.startswith('a)') and len(next_title) > 3:
                        current_minor_title = next_title
                        break
            
            if not unit:  # Only add if not combined with unit
                occupations.append({
                    'code': current_minor,
                    'display': current_minor_title or f"Minor Group {current_minor}",
                    'level': 'minor',
                    'parent': current_sub_major
                })
            i += 1
            continue
        
        # Unit Group (4 digits, e.g., 1111, 2111)
        if unit:
            unit_code = clean_code(unit)
            if unit_code and len(unit_code) == 4:
                # Get title from same row or next row
                unit_title = None
                if title and not title.startswith('Tasks') and 'Major Group' not in title:
                    unit_title = title
                else:
                    for j in range(i+1, min(i+5, len(df))):
                        next_title = clean_text(df.iloc[j][title_col])
                        if next_title and not next_title.startswith('Tasks') and not next_title.startswith('a)') and len(next_title) > 3:
                            unit_title = next_title
                            break
                
                # Determine parent (minor group = first 3 digits)
                parent_minor = unit_code[:3]
                
                occupations.append({
                    'code': unit_code,
                    'display': unit_title or f"Unit Group {unit_code}",
                    'level': 'unit',
                    'parent': parent_minor if len(parent_minor) == 3 else current_minor
                })
        
        i += 1
    
    return occupations

def extract_occupation_titles(df):
    """Extract specific occupation titles from unit groups"""
    titles = []
    title_col = 'OCCUPATIONAL TITLES AND DEFINITIONS'
    unit_col = 'UNIT\nGROUP'
    
    current_unit = None
    in_examples = False
    
    for i, row in df.iterrows():
        unit = clean_code(row[unit_col])
        title = clean_text(row[title_col])
        
        if unit and len(str(unit)) == 4:
            current_unit = unit
            in_examples = False
            continue
        
        if title:
            # Check if we're entering examples section
            if 'Examples of the occupations' in title or 'occupations classified here' in title:
                in_examples = True
                continue
            
            # Collect example occupation titles
            if in_examples and current_unit:
                # Skip task descriptions and headers
                if (not title.startswith('Tasks') and 
                    not title.startswith('Their tasks') and
                    not title.startswith('a)') and 
                    not title.startswith('b)') and
                    not title.startswith('c)') and
                    not title.startswith('d)') and
                    not title.startswith('e)') and
                    not title.startswith('f)') and
                    not title.startswith('g)') and
                    not title.startswith('h)') and
                    len(title) < 100 and
                    len(title) > 2):
                    titles.append({
                        'title': title,
                        'unit_code': current_unit
                    })
            
            # Check if we're leaving examples section
            if title.startswith('Occupations in this') or 'not classified elsewhere' in title.lower():
                in_examples = False
    
    return titles

def main():
    excel_file = '2022-Updates-to-the-2012-PSOC.xlsx'
    df_dict = pd.read_excel(excel_file, sheet_name=None)
    
    all_occupations = []
    all_titles = []
    
    # Major group mapping
    major_groups = {
        'Group 0': {'code': '0', 'display': 'Armed Forces Occupations'},
        'Group 1': {'code': '1', 'display': 'Managers'},
        'Group 2': {'code': '2', 'display': 'Professionals'},
        'Group 3': {'code': '3', 'display': 'Technicians and Associate Professionals'},
        'Group 4': {'code': '4', 'display': 'Clerical Support Workers'},
        'Group 5': {'code': '5', 'display': 'Service and Sales Workers'},
        'Group 6': {'code': '6', 'display': 'Skilled Agricultural, Forestry and Fishery Workers'},
        'Group 7': {'code': '7', 'display': 'Craft and Related Trades Workers'},
        'Group 8': {'code': '8', 'display': 'Plant and Machine Operators, and Assemblers'},
        'Group 9': {'code': '9', 'display': 'Elementary Occupations'},
    }
    
    # Add major groups first
    for sheet_name, mg_info in major_groups.items():
        all_occupations.append({
            'code': mg_info['code'],
            'display': mg_info['display'],
            'level': 'major',
            'parent': None
        })
    
    # Process each sheet
    for sheet_name, df in df_dict.items():
        if sheet_name in major_groups:
            major_num = int(major_groups[sheet_name]['code'])
            
            # Use special extraction for Group 0 (Armed Forces)
            if sheet_name == 'Group 0':
                occupations = extract_group0_occupations(df)
            else:
                occupations = extract_occupations_from_sheet(df, major_num)
            
            all_occupations.extend(occupations)
            
            titles = extract_occupation_titles(df)
            all_titles.extend(titles)
            
            print(f"Processed {sheet_name}: {len(occupations)} occupation codes, {len(titles)} example titles")
    
    # Remove duplicates and sort
    seen_codes = set()
    unique_occupations = []
    for occ in all_occupations:
        if occ['code'] not in seen_codes:
            seen_codes.add(occ['code'])
            unique_occupations.append(occ)
    
    unique_occupations.sort(key=lambda x: (len(x['code']), x['code']))
    
    print(f"\nTotal unique occupation codes: {len(unique_occupations)}")
    print(f"Total example titles: {len(all_titles)}")
    
    # Generate FHIR CodeSystem
    codesystem = {
        "resourceType": "CodeSystem",
        "id": "PSOC",
        "url": "http://psa.gov.ph/fhir/CodeSystem/PSOC",
        "version": "2022",
        "name": "PSOC",
        "title": "2022 Philippine Standard Occupational Classification",
        "status": "active",
        "experimental": False,
        "date": "2022-01-01",
        "publisher": "Philippine Statistics Authority",
        "description": "The 2022 Philippine Standard Occupational Classification (PSOC) is the national standard classification of occupations in the Philippines, based on the 2008 International Standard Classification of Occupations (ISCO-08).",
        "caseSensitive": True,
        "hierarchyMeaning": "is-a",
        "content": "complete",
        "property": [
            {
                "code": "level",
                "description": "The hierarchical level of the occupation code",
                "type": "string"
            },
            {
                "code": "parent",
                "description": "The parent code in the hierarchy",
                "type": "code"
            }
        ],
        "concept": []
    }
    
    for occ in unique_occupations:
        concept = {
            "code": occ['code'],
            "display": occ['display'],
            "property": [
                {"code": "level", "valueString": occ['level']}
            ]
        }
        if occ['parent']:
            concept["property"].append({"code": "parent", "valueCode": occ['parent']})
        
        codesystem["concept"].append(concept)
    
    # Write CodeSystem
    with open('resources/CodeSystem-PSOC.json', 'w', encoding='utf-8') as f:
        json.dump(codesystem, f, indent=2, ensure_ascii=False)
    
    print(f"\nGenerated resources/CodeSystem-PSOC.json with {len(codesystem['concept'])} concepts")
    
    # Generate ValueSet
    valueset = {
        "resourceType": "ValueSet",
        "id": "occupational-classifications",
        "url": "http://psa.gov.ph/fhir/ValueSet/occupational-classifications",
        "version": "2022",
        "name": "OccupationalClassifications",
        "title": "Philippine Standard Occupational Classifications",
        "status": "active",
        "experimental": False,
        "date": "2022-01-01",
        "publisher": "Philippine Statistics Authority",
        "description": "Value set containing all occupation codes from the 2022 Philippine Standard Occupational Classification (PSOC)",
        "compose": {
            "include": [
                {
                    "system": "http://psa.gov.ph/fhir/CodeSystem/PSOC"
                }
            ]
        }
    }
    
    with open('resources/ValueSet-occupational-classifications.json', 'w', encoding='utf-8') as f:
        json.dump(valueset, f, indent=2, ensure_ascii=False)
    
    print(f"Generated resources/ValueSet-occupational-classifications.json")
    
    # Print sample codes for verification
    print("\n--- Sample Occupation Codes ---")
    for level in ['major', 'sub-major', 'minor', 'unit']:
        sample = [o for o in unique_occupations if o['level'] == level][:3]
        print(f"\n{level.upper()} ({len([o for o in unique_occupations if o['level'] == level])} total):")
        for s in sample:
            print(f"  {s['code']}: {s['display']}")

if __name__ == "__main__":
    main()