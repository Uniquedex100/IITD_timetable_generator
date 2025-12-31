
import json
import re
import sys
import os
from collections import defaultdict

try:
    import PyPDF2
except ImportError:
    print("Error: PyPDF2 is not installed.")
    print("Please install it using: pip install PyPDF2")
    sys.exit(1)

# --- CONFIGURATION ---
JSON_PATH = os.path.join(os.path.dirname(__file__), '../src/courses.json')
PDF_PATH = os.path.join(os.path.dirname(__file__), '../Room_Allotment_Chart_2025_2026_2.pdf')

# Regex patterns
COURSE_REGEX = r"\b([A-Z]{3}\d{3,4}[A-Z]?)\b"
VENUE_PATTERNS = [
    r"LH\s?\d{3}(\.\d+)?", # Matches LH 123, LH123, LH 413.1
    r"[IV]{1,3}\s?LT\s?\d", # Matches III LT 1
    r"[IV]{1,3}\s?\d{3}",   # Matches IIA 301
    r"IIA\s?\d{3}",
    r"\bDH\b"
]
VENUE_REGEX = r"(" + "|".join(VENUE_PATTERNS) + r")"

def normalize_venue(v):
    if not v: return None
    # Normalize spaces: "LH 108" -> "LH 108". 
    # Just ensure consistent spacing if needed, but for now exact extraction + trimming is fine.
    return " ".join(v.split())

def parse_pdf(pdf_path):
    print(f"Parsing PDF: {pdf_path}")
    pdf_courses = defaultdict(set)
    
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                if not text: continue
                
                lines = text.split('\n')
                
                current_venue = None
                buffer_courses = []
                
                for line in lines:
                    # Check for reset (Header row)
                    if line.startswith("Room") and ("8-9" in line or "Day" in line):
                        current_venue = None
                        buffer_courses = []
                        continue
                    
                    # Search for Venue
                    venue_match = re.search(VENUE_REGEX, line)
                    
                    # Find courses in this line
                    line_courses = re.findall(COURSE_REGEX, line)
                    
                    valid_courses = []
                    for c in line_courses:
                        # Ensure we don't pick up the venue text itself if it matches course regex accidentally
                        if re.fullmatch(VENUE_REGEX, c):
                            continue
                        valid_courses.append(c)
                    
                    if venue_match:
                        found_venue = normalize_venue(venue_match.group(0))
                        current_venue = found_venue
                        
                        # Flush buffer
                        for bc in buffer_courses:
                            pdf_courses[bc].add(current_venue)
                        buffer_courses = []
                        
                        # Add current line courses
                        for c in valid_courses:
                            pdf_courses[c].add(current_venue)
                            
                    else:
                        if current_venue:
                            for c in valid_courses:
                                pdf_courses[c].add(current_venue)
                        else:
                            # Accumulate in buffer waiting for venue
                            for c in valid_courses:
                                buffer_courses.append(c)
                                
    except Exception as e:
        print(f"Failed to parse PDF: {e}")
        return {}

    return pdf_courses

def update_json(json_path, pdf_data):
    print(f"Loading JSON: {json_path}")
    try:
        with open(json_path, 'r') as f:
            courses = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {json_path}")
        return

    updated_count = 0
    
    for course in courses:
        code = course.get('courseCode')
        if not code: continue
        
        if code in pdf_data:
            pdf_venues = pdf_data[code]
            if not pdf_venues: continue
            
            # Formulate the new venue string
            sorted_venues = sorted(list(pdf_venues))
            new_venue_str = ", ".join(sorted_venues)
            
            old_venue = course.get('lectureHall')
            
            if old_venue != new_venue_str:
                course['lectureHall'] = new_venue_str
                updated_count += 1
                # Optional: print(f"Updated {code}: {old_venue} -> {new_venue_str}")
                
    if updated_count > 0:
        print(f"Updating {updated_count} courses...")
        with open(json_path, 'w') as f:
            json.dump(courses, f, indent=2)
        print("Success: courses.json updated.")
    else:
        print("No changes needed. courses.json is already up to date.")

def main():
    if not os.path.exists(PDF_PATH):
        print(f"Error: PDF not found at {PDF_PATH}")
        return

    pdf_data = parse_pdf(PDF_PATH)
    if not pdf_data:
        print("No venue data found in PDF.")
        return

    update_json(JSON_PATH, pdf_data)

if __name__ == "__main__":
    main()
