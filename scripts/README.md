# Compliance SaaS Utility Scripts

This folder contains utility scripts for maintaining the NZ Water Compliance SaaS system.

## Scripts

### download-regulations.js

Downloads regulation documents from NZ government websites.

**Setup:**
```bash
cd scripts
npm install
```

**Usage:**
```bash
npm run download-regulations
```

**What it does:**
- Scrapes Taumata Arowai, DIA, and Ministry of Health websites
- Downloads PDF and Word documents
- Creates metadata.json for each document
- Generates download report
- Updates docs/index.md

**Rate Limiting:**
- 2 second delay between requests (respectful scraping)

**Output:**
- Documents saved to `/docs/regulations/` folders
- Metadata: `{filename}.metadata.json`
- Report: `/docs/download-report.json`

**Manual Actions Required:**
Some documents require:
- Authentication/login
- Purchase from Standards NZ
- Request from government agencies

These must be downloaded manually and placed in appropriate folders.

### check-regulation-updates.js
(To be created - checks for updated regulations quarterly)

## Critical Document Checklist

After running the download script, verify these critical documents are present:

- [ ] Water Services Act 2021
- [ ] Taumata Arowai Drinking Water Quality Assurance Rules
- [ ] Drinking Water Standards for New Zealand 2005 (revised 2018)
- [ ] Local Water Done Well Implementation Guide
- [ ] Drinking Water Safety Plan template
- [ ] Water Services Regulations 2022
- [ ] Asset Management Plan guidelines
- [ ] Compliance, Monitoring and Enforcement Strategy
- [ ] Information disclosure requirements

## Notes

- Documents are prefixed with download date for version tracking
- Metadata tracks source URL, version, and relevance
- Re-running the script skips already downloaded documents
- Check download-report.json for summary

## Maintenance Schedule

**Quarterly (every 3 months):**
1. Run `npm run download-regulations` to check for new documents
2. Review any new or updated documents
3. Assess impact on software features
4. Update compliance requirements database
5. Communicate changes to stakeholders
