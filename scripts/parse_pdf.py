
import json
import os
import subprocess
import re

COURSE_JSON_PATH = 'src/courses.json'
PDF_PATH = 'Room_Allotment_Chart_2025_2026_2.pdf'
TXT_PATH = 'output.txt'

def generate_text():
    if not os.path.exists(TXT_PATH):
        print("Generating text from PDF...")
        subprocess.run(['pdftotext', '-layout', PDF_PATH, TXT_PATH], check=True)
    with open(TXT_PATH, 'r') as f:
        return f.read()

def get_rooms_on_page(page_text):
    rooms = []
    lines = page_text.split('\n')
    for line in lines:
        if 'WED' in line:
            # Assuming format "LH 108 WED..."
            # Split by WED and take the first part representing the room
            # The room name might be "LH 108", "LH 111", etc.
            # Sometimes there is (339) or similar below it, but we want the main room name.
            parts = line.split('WED')
            potential_room = parts[0].strip()
            if potential_room:
                 rooms.append(potential_room)
    return rooms

def get_table_index(page_text, course_code):
    # Logic from get_lh.py: count how many "Room" markers appear before the course code
    # We scan line by line to determine "blocks"
    
    # Simpler approach matching get_lh.py:
    # "items = page_text.split('\n')[1:] ... checkpoint += 1 if i.startswith('Room')"
    
    lines = page_text.split('\n')
    checkpoint = -1
    found = False
    
    # We need to be careful: the text might contain the course code multiple times?
    # get_lh.py just checked "if course_code.upper() in i".
    # But wait, we need the *first* occurrence? Or the one corresponding to the layout?
    # get_lh.py iterates lines.
    
    # get_lh.py just checked "if course_code.upper() in i".
    # But wait, we need the *first* occurrence? Or the one corresponding to the layout?
    # get_lh.py iterates lines.
    
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('Room') and not stripped.startswith('Room Allotment'):
            checkpoint += 1
        
        # Check if course code is in this line. 
        # Note: Courses can be "APL105", "COL362/COL632".
        # We need to be robust.
        if course_code in line:
            return checkpoint
            
    return None

def main():
    full_text = generate_text()
    pages = full_text.split('\x0c') # Form feed character
    
    with open(COURSE_JSON_PATH, 'r') as f:
        courses = json.load(f)
    
    updated_count = 0
    
    for course in courses:
        code = course['courseCode']
        lecture_hall = None
        
        # Iterate pages to find the course
        found_in_page = False
        for page_idx, page_text in enumerate(pages):
            if code not in page_text:
                continue
            
            # Found course in this page.
            # Now find which table/room it belongs to.
            
            # Extract rooms on this page
            rooms = get_rooms_on_page(page_text)
            if not rooms:
                continue
                
            # Find table index
            tn = get_table_index(page_text, code)
            
            if tn is not None and 0 <= tn < len(rooms):
                lecture_hall = rooms[tn]
                found_in_page = True
                break # Found it
        
        if lecture_hall:
            course['lectureHall'] = lecture_hall
            updated_count += 1
            print(f"Mapped {code} -> {lecture_hall}")
        else:
            # print(f"Could not find room for {code}")
            pass

    print(f"Updated {updated_count} courses.")
    
    with open(COURSE_JSON_PATH, 'w') as f:
        json.dump(courses, f, indent=4)

if __name__ == "__main__":
    main()
