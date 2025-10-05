import os
import requests

# === Create a folder to store downloaded PDFs ===
download_dir = "drinking_water_docs"
os.makedirs(download_dir, exist_ok=True)

# === Dictionary: File name → Download link ===
pdf_links = {
    # Priority 1
    "Compliance_Strategy_2025-2028.pdf": "https://www.taumataarowai.govt.nz/assets/Uploads/CME-2025-28/Compliance-Monitoring-and-Enforcement-Strategy-2025-28-Water-Services-Authority-Taumata-Arowai.pdf",
    "Compliance_Strategy_2022-2025.pdf": "https://www.taumataarowai.govt.nz/assets/Uploads/Governance-docs/Compliance-Monitoring-and-Enforcement-Strategy-2022-2025.pdf",
    "DWSP_Template_Small_26-100.pdf": "https://www.taumataarowai.govt.nz/assets/Uploads/Guidance/DWSP-guidance-and-templates/DWSP-Template-Supplying-26-100-people.pdf",
    "DWSP_Template_Medium_101-500.pdf": "https://www.taumataarowai.govt.nz/assets/Uploads/Guidance/DWSP-guidance-and-templates/Guidance/DWSP-Guidance-Supplying-101-500-people_014-v2.pdf",
    "DWSP_Template_Temporary.pdf": "https://www.taumataarowai.govt.nz/assets/Uploads/Guidance/DWSP-guidance-and-templates/Guidance/Guidance-Drinking-Water-Safety-Planning-for-a-Temporary-Drinking-Water-Supply.pdf",
    "Quick_Guide_to_Uploading_DWSP.pdf": "https://www.taumataarowai.govt.nz/assets/Uploads/Quick-Reference-Guides/Quick-guide-to-uploading-your-DWSP.pdf",
    "DWQAR_Reporting_Guidelines.pdf": "https://www.taumataarowai.govt.nz/assets/Portal/Drinking-Water-Quality-Assurance-Rules-Reporting-Guidance.pdf",
    "Drinking_Water_Standards_Draft_2021.pdf": "https://korero.taumataarowai.govt.nz/regulatory/drinking-water-standards/user_uploads/drinking-water-standards.pdf",

    # Acts & Regulations
    "Water_Services_Act_2021.pdf": "https://www.legislation.govt.nz/act/public/2021/0036/latest/whole.pdf",
    "Drinking_Water_Standards_Regulations_2022.pdf": "https://www.legislation.govt.nz/regulation/public/2022/0168/latest/whole.pdf",

    # Priority 2
    "Acceptable_Solution_Rural_Agricultural.pdf": "https://www.taumataarowai.govt.nz/assets/Uploads/Acceptable-Solutions-etc/Old-Acceptable-Solutions/Drinking-Water-Acceptable-Solution-for-Rural-Agricultural-Water-Supplies.pdf",
    "Acceptable_Solution_Roof_Water.pdf": "https://korero.taumataarowai.govt.nz/regulatory/drinking-water-acceptable-solution-for-roof-water/user_uploads/drinking-water-acceptable-solution-for-roof-water-supplies-.pdf",
    "Acceptable_Solution_Mixed-Use_Rural_2025.pdf": "https://www.taumataarowai.govt.nz/assets/Uploads/Acceptable-Solutions-etc/Water-Services-Mixed-use-Rural-Drinking-Water-Acceptable-Solution-2025.pdf",
}

# === Function to download each file ===
def download_pdf(name, url):
    print(f"Downloading: {name}")
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/pdf,application/octet-stream,*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.taumataarowai.govt.nz/',
        }
        response = requests.get(url, timeout=30, headers=headers, allow_redirects=True)
        response.raise_for_status()  # Raise error if status code != 200
        file_path = os.path.join(download_dir, name)
        with open(file_path, "wb") as f:
            f.write(response.content)
        print(f"SUCCESS: Saved {file_path} ({len(response.content)} bytes)")
    except Exception as e:
        print(f"FAILED: {name} - {str(e)}")

# === Loop through the dictionary and download ===
for filename, link in pdf_links.items():
    download_pdf(filename, link)

print("\nAll downloads attempted. Check the 'drinking_water_docs' folder.")
