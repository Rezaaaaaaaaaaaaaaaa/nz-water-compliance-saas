import os
import requests

# === Create a folder to store downloaded files ===
download_dir = "drinking_water_docs"
os.makedirs(download_dir, exist_ok=True)

# === Additional documents found ===
additional_docs = {
    "DWQAR_Reporting_Template.xlsx": "https://www.taumataarowai.govt.nz/assets/Portal/DWQAR-Reporting-Template.xlsx",
    "DWQAR_Assurance_Rules_Template.xlsx": "https://www.taumataarowai.govt.nz/assets/Portal/DWQAR-Assurance-Rules-Template.xlsx",
    "Monitoring_Water_Quality_Supply_Summary_Table.pdf": "https://www.taumataarowai.govt.nz/assets/Guidance-and-Resources/Monitoring-Water-Quality-Supply-Summary-Table.pdf",
    "Rules_Reporting_Webform_Hinekorako_Guide.pdf": "https://www.taumataarowai.govt.nz/assets/Guidance-and-Resources/Rules-Reporting-Webform-Hinekorako-Guide.pdf",
    "DWQAR_Guidance_for_Small_Supplies.pdf": "https://www.taumataarowai.govt.nz/assets/Uploads/DWQAR-guidance-for-small-supplies.pdf",
    "DWQAR_Reporting_Guidelines_Draft.pdf": "https://korero.taumataarowai.govt.nz/technology/dwqar-reporting-guidelines/user_uploads/drinking-water-quality-assurance-rules-reporting-guidelines---draft-1.pdf",
}

# === Function to download each file ===
def download_file(name, url):
    print(f"Downloading: {name}")
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.taumataarowai.govt.nz/',
        }
        response = requests.get(url, timeout=30, headers=headers, allow_redirects=True)
        response.raise_for_status()
        file_path = os.path.join(download_dir, name)
        with open(file_path, "wb") as f:
            f.write(response.content)
        file_size = len(response.content)
        size_kb = file_size / 1024
        print(f"SUCCESS: Saved {file_path} ({size_kb:.1f} KB)")
        return True
    except Exception as e:
        print(f"FAILED: {name} - {str(e)}")
        return False

# === Download all files ===
print("=" * 70)
print("Downloading Additional NZ Water Regulatory Documents")
print("=" * 70)
print()

success_count = 0
failed_count = 0

for filename, link in additional_docs.items():
    if download_file(filename, link):
        success_count += 1
    else:
        failed_count += 1
    print()

print("=" * 70)
print(f"Download Summary:")
print(f"  Success: {success_count}/{len(additional_docs)}")
print(f"  Failed:  {failed_count}/{len(additional_docs)}")
print(f"  Folder:  {download_dir}")
print("=" * 70)
