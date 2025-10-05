"""
DWSP Template Analyzer
Analyzes Drinking Water Safety Plan PDF templates to extract structure and requirements
"""

import PyPDF2
import json
import re
from pathlib import Path

TEMPLATE_DIR = Path("C:/compliance-saas/docs/regulations/taumata-arowai")
OUTPUT_DIR = Path("C:/compliance-saas/docs/regulatory-analysis")

TEMPLATES = [
    "DWSP_Template_Small_26-100.pdf",
    "DWSP_Template_Medium_101-500.pdf"
]

def extract_pdf_text(pdf_path):
    """Extract text from PDF file"""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n\n"
    except Exception as e:
        print(f"[ERROR] Failed to read {pdf_path.name}: {e}")
    return text

def find_dwsp_elements(text):
    """Find the 12 mandatory DWSP elements in the text"""

    # Known 12 mandatory elements based on Taumata Arowai requirements
    elements = {
        "element_1": {
            "title": "Description of the drinking water supply",
            "keywords": ["description", "supply details", "water supply"],
            "found": False,
            "sections": []
        },
        "element_2": {
            "title": "Hazardous events and hazards",
            "keywords": ["hazard", "hazardous event", "risk"],
            "found": False,
            "sections": []
        },
        "element_3": {
            "title": "Preventive measures for hazards",
            "keywords": ["preventive", "control measure", "barrier"],
            "found": False,
            "sections": []
        },
        "element_4": {
            "title": "Operational monitoring",
            "keywords": ["operational monitor", "daily check", "routine"],
            "found": False,
            "sections": []
        },
        "element_5": {
            "title": "Verification monitoring",
            "keywords": ["verification", "compliance check", "testing"],
            "found": False,
            "sections": []
        },
        "element_6": {
            "title": "Corrective action",
            "keywords": ["corrective action", "response", "non-compliance"],
            "found": False,
            "sections": []
        },
        "element_7": {
            "title": "Incident and emergency response",
            "keywords": ["incident", "emergency", "contingency"],
            "found": False,
            "sections": []
        },
        "element_8": {
            "title": "Management of the drinking water supply",
            "keywords": ["management", "responsibility", "roles"],
            "found": False,
            "sections": []
        },
        "element_9": {
            "title": "Documentation and communication",
            "keywords": ["documentation", "communication", "record"],
            "found": False,
            "sections": []
        },
        "element_10": {
            "title": "Improvement planning",
            "keywords": ["improvement", "upgrade", "future"],
            "found": False,
            "sections": []
        },
        "element_11": {
            "title": "Supply details",
            "keywords": ["population", "source", "treatment process"],
            "found": False,
            "sections": []
        },
        "element_12": {
            "title": "Review and approval",
            "keywords": ["review", "approval", "sign-off"],
            "found": False,
            "sections": []
        }
    }

    # Search for elements
    lines = text.split('\n')
    for line in lines:
        line_lower = line.lower()
        for elem_key, elem_data in elements.items():
            for keyword in elem_data["keywords"]:
                if keyword in line_lower and len(line.strip()) > 0:
                    elem_data["found"] = True
                    if line.strip() not in elem_data["sections"]:
                        elem_data["sections"].append(line.strip())

    return elements

def analyze_template(template_name):
    """Analyze a single DWSP template"""

    print(f"\n{'=' * 70}")
    print(f"ANALYZING: {template_name}")
    print(f"{'=' * 70}\n")

    pdf_path = TEMPLATE_DIR / template_name

    if not pdf_path.exists():
        print(f"[ERROR] File not found: {pdf_path}")
        return None

    # Get file info
    file_size = pdf_path.stat().st_size / 1024  # KB
    print(f"File size: {file_size:.1f} KB")

    # Extract text
    print("Extracting text from PDF...")
    text = extract_pdf_text(pdf_path)

    # Get page count
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        page_count = len(pdf_reader.pages)

    print(f"Pages: {page_count}")
    print(f"Text length: {len(text)} characters\n")

    # Find DWSP elements
    print("Searching for 12 mandatory DWSP elements...\n")
    elements = find_dwsp_elements(text)

    # Summary
    found_count = sum(1 for e in elements.values() if e["found"])
    print(f"Elements found: {found_count}/12\n")

    for elem_key, elem_data in elements.items():
        status = "[FOUND]" if elem_data["found"] else "[NOT FOUND]"
        print(f"  {status} {elem_data['title']}")
        if elem_data["sections"][:3]:  # Show first 3 matches
            for section in elem_data["sections"][:3]:
                if len(section) < 100:
                    print(f"           - {section}")

    print()

    return {
        "template_name": template_name,
        "file_size_kb": file_size,
        "page_count": page_count,
        "text_length": len(text),
        "elements": elements,
        "elements_found": found_count
    }

def main():
    """Main analysis function"""

    print("=" * 70)
    print("DWSP TEMPLATE STRUCTURE ANALYSIS")
    print("Taumata Arowai Drinking Water Safety Plan Templates")
    print("=" * 70)

    results = []

    for template in TEMPLATES:
        result = analyze_template(template)
        if result:
            results.append(result)

    # Save results
    output_file = OUTPUT_DIR / "dwsp_template_analysis.json"
    with open(output_file, "w") as f:
        json.dump({
            "analysis_date": "2025-10-05",
            "templates_analyzed": len(results),
            "results": results
        }, f, indent=2)

    print("\n" + "=" * 70)
    print("ANALYSIS COMPLETE")
    print("=" * 70)
    print(f"\nResults saved to: {output_file}")
    print("\nNext step: Map elements to database schema")
    print()

if __name__ == "__main__":
    main()
