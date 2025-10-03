# NZ Water Compliance Regulations Documentation

This folder contains all regulatory documentation and templates for NZ water utility compliance.

## Folder Structure

### `/regulations`
Contains official regulatory documents from various NZ government agencies:

- **`/taumata-arowai`** - Taumata Arowai (Water Services Regulator) documents
  - Drinking Water Quality Assurance Rules
  - Water Services Act 2021 documentation
  - Compliance, Monitoring and Enforcement Strategy

- **`/local-water-done-well`** - Department of Internal Affairs guidance
  - Implementation guides
  - Best practice documents

- **`/drinking-water-standards`** - NZ Drinking Water Standards
  - DWSNZ 2005 (revised 2018)
  - Water Services (Drinking Water Standards for Networked Supplies) Regulations 2022

- **`/wastewater-standards`** - Wastewater compliance standards

### `/templates`
Official templates for compliance submissions:

- **`/compliance-plans`** - Drinking Water Safety Plan templates
- **`/report-formats`** - Annual compliance report templates, information disclosure templates

### `/industry-standards`
Standards New Zealand and industry best practices:
- NZS 4404 and related water standards
- Water New Zealand guidelines

### `/meeting-notes`
Documentation from stakeholder meetings and regulatory consultations

## Critical Documents Checklist

- [ ] Water Services Act 2021 (full text)
- [ ] Taumata Arowai Drinking Water Quality Assurance Rules
- [ ] Drinking Water Standards for New Zealand 2005 (revised 2018)
- [ ] Local Water Done Well - Implementation guidance
- [ ] Drinking Water Safety Plan templates (Taumata Arowai)
- [ ] Water Services (Drinking Water Standards for Networked Supplies) Regulations 2022
- [ ] Asset Management Plan guidelines
- [ ] Compliance, Monitoring and Enforcement Strategy
- [ ] Information disclosure requirements
- [ ] Ring-fencing guidelines for CCOs

## Document Sources

### Government Websites
- **Taumata Arowai**: https://www.taumataarowai.govt.nz
- **Department of Internal Affairs**: https://www.dia.govt.nz/local-water-done-well
- **Ministry of Health**: https://www.health.govt.nz (water quality guidelines)
- **Standards New Zealand**: https://www.standards.govt.nz

### Update Frequency
Regulations are reviewed and updated periodically. Check sources quarterly for updates.

## Metadata Tracking

Each document should have an accompanying metadata.json file with:
```json
{
  "title": "Document Title",
  "source": "Source Organization",
  "sourceUrl": "https://...",
  "downloadDate": "2025-10-03",
  "version": "1.0",
  "effectiveDate": "2025-01-01",
  "summary": "Brief description of document contents",
  "relevantSections": ["Section 1", "Section 2"],
  "relatedDocuments": ["doc-id-1", "doc-id-2"]
}
```

## Document Relationships

1. **Water Services Act 2021** - Primary legislation
2. **Taumata Arowai Rules** - Implements the Act
3. **DWSNZ** - Technical standards referenced by rules
4. **Local Water Done Well** - Implementation guidance for councils
5. **Templates** - Practical application of requirements

## Maintenance

**Quarterly Review Tasks:**
1. Check all source websites for new publications
2. Download any updated documents
3. Update metadata.json files
4. Update index.md with changes
5. Assess impact on software features
6. Communicate changes to development team and customers

**Last Updated:** 2025-10-03
**Next Review Due:** 2026-01-03
