"""
Compliance Strategy Analyzer
Analyzes Taumata Arowai Compliance Strategy documents to extract enforcement priorities
"""

import PyPDF2
import json
import re
from pathlib import Path

TEMPLATE_DIR = Path("C:/compliance-saas/docs/regulations/taumata-arowai")
OUTPUT_DIR = Path("C:/compliance-saas/docs/regulatory-analysis")

STRATEGIES = [
    "Compliance_Strategy_2025-2028.pdf",
    "Compliance_Strategy_2022-2025.pdf"
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

def extract_priorities(text):
    """Extract compliance priorities and focus areas"""

    priorities = {
        "high_risk_areas": [],
        "enforcement_focus": [],
        "supply_categories": [],
        "key_metrics": [],
        "risk_factors": []
    }

    # Search for key terms
    lines = text.split('\n')

    # Keywords indicating priorities
    priority_keywords = ['priority', 'focus', 'high risk', 'critical', 'essential']
    category_keywords = ['category', 'tier', 'level', 'classification']
    risk_keywords = ['risk', 'hazard', 'threat', 'vulnerable']

    for i, line in enumerate(lines):
        line_lower = line.lower()

        # High risk areas
        if any(keyword in line_lower for keyword in ['high risk', 'critical', 'priority']):
            if len(line.strip()) > 20 and len(line.strip()) < 200:
                priorities["high_risk_areas"].append(line.strip())

        # Supply categories/tiers
        if any(keyword in line_lower for keyword in ['category', 'tier', 'supplier']):
            if len(line.strip()) > 15 and len(line.strip()) < 150:
                priorities["supply_categories"].append(line.strip())

        # Risk factors
        if any(keyword in line_lower for keyword in ['risk factor', 'risk level']):
            if len(line.strip()) > 15 and len(line.strip()) < 150:
                priorities["risk_factors"].append(line.strip())

    # Remove duplicates
    for key in priorities:
        priorities[key] = list(set(priorities[key]))[:10]  # Top 10 unique

    return priorities

def analyze_strategy(strategy_name):
    """Analyze a single compliance strategy document"""

    print(f"\n{'=' * 70}")
    print(f"ANALYZING: {strategy_name}")
    print(f"{'=' * 70}\n")

    pdf_path = TEMPLATE_DIR / strategy_name

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

    # Extract priorities
    print("Extracting compliance priorities...\n")
    priorities = extract_priorities(text)

    # Summary
    print(f"High Risk Areas Found: {len(priorities['high_risk_areas'])}")
    print(f"Supply Categories Found: {len(priorities['supply_categories'])}")
    print(f"Risk Factors Found: {len(priorities['risk_factors'])}\n")

    # Show samples
    print("Sample High Risk Areas:")
    for item in priorities["high_risk_areas"][:5]:
        print(f"  - {item[:100]}...")

    print()

    return {
        "document_name": strategy_name,
        "file_size_kb": file_size,
        "page_count": page_count,
        "text_length": len(text),
        "priorities": priorities
    }

def main():
    """Main analysis function"""

    print("=" * 70)
    print("COMPLIANCE STRATEGY ANALYSIS")
    print("Taumata Arowai Enforcement Priorities 2025-2028")
    print("=" * 70)

    results = []

    for strategy in STRATEGIES:
        result = analyze_strategy(strategy)
        if result:
            results.append(result)

    # Save results
    output_file = OUTPUT_DIR / "compliance_strategy_analysis.json"
    with open(output_file, "w") as f:
        json.dump({
            "analysis_date": "2025-10-05",
            "documents_analyzed": len(results),
            "results": results
        }, f, indent=2)

    print("\n" + "=" * 70)
    print("ANALYSIS COMPLETE")
    print("=" * 70)
    print(f"\nResults saved to: {output_file}")
    print("\nNext step: Design updated compliance scoring algorithm")
    print()

if __name__ == "__main__":
    main()
