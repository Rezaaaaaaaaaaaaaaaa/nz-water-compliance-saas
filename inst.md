# Building Regulatory Compliance SaaS with Claude Code

## What is Claude Code?

Claude Code is a command-line tool that allows you to work with Claude AI directly in your terminal to accomplish coding tasks. It's designed for agentic coding - delegating entire features or tasks to Claude rather than writing code line-by-line yourself.

**Best Use Cases:**
- Generating boilerplate code and project structure
- Implementing well-defined features
- Writing tests
- Refactoring existing code
- Debugging issues
- Creating documentation

**Not Ideal For:**
- Complex architectural decisions (you should design first)
- Tasks requiring deep domain knowledge (water compliance specifics)
- Critical security implementations (review carefully)

---

## Setup and Prerequisites

### Installation

First, ensure you have Claude Code installed. Check the documentation at https://docs.claude.com/en/docs/claude-code for latest installation instructions.

Typical installation:
```bash
# Installation method varies by system
# Check official docs for current method
```

### Project Initialization

Before using Claude Code, set up your project structure manually:

```bash
mkdir compliance-saas
cd compliance-saas
mkdir -p backend frontend infrastructure docs
```

### Authentication

Configure Claude Code with your API credentials:
```bash
# Follow authentication setup from docs
# This connects Claude Code to your Anthropic account
```

---

## Phase-by-Phase Implementation with Claude Code

## PHASE 0: PROJECT SCAFFOLDING

### Task 0: Download and Organize NZ Regulatory Documents

**CRITICAL FIRST STEP:** Before any development, gather all regulatory documentation that Claude Code will reference throughout the project.

**What to ask Claude Code:**

```
Create a documentation collection system for NZ water compliance regulations:

1. Create folder structure:
   /docs
     /regulations
       /taumata-arowai
       /local-water-done-well
       /drinking-water-standards
       /wastewater-standards
     /templates
       /compliance-plans
       /report-formats
     /industry-standards
     /meeting-notes

2. Create a script to download and organize NZ water regulation documents from:
   - Taumata Arowai website (www.taumataarowai.govt.nz)
   - Department of Internal Affairs - Local Water Done Well
   - NZ Drinking Water Standards (DWSNZ)
   - Ministry of Health water quality guidelines
   - Water Services Act 2021 documentation
   - Standards New Zealand (water-related standards)

3. For each document downloaded:
   - Save with descriptive filename (date-source-title.pdf)
   - Create metadata.json tracking: source URL, download date, version, summary
   - Generate index.md with document inventory

4. Create README.md explaining:
   - What each regulation covers
   - Relationships between documents
   - Update frequency
   - Where to check for new versions

Use Node.js with axios for downloads, cheerio for web scraping if needed.
Handle rate limiting respectfully.
```

**What Claude Code will do:**
- Create organized folder structure
- Generate download script
- Create metadata tracking system
- Build document index

**Your role after:**
- Review the script before running (check URLs are correct)
- Run the download script
- Manually add any PDFs that require authentication/purchase
- Verify all critical documents are present
- Read through key documents yourself (don't just rely on Claude Code)

**Critical Documents Checklist:**
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

**Manual Collection (May Require Purchase/Access):**
- Standards New Zealand water-related standards (NZS 4404, etc.)
- Local council-specific requirements
- Industry best practice guides from Water New Zealand

**Keep Documents Updated:**
Create a quarterly task to check for regulation updates. Regulatory requirements change, and your software must stay current.

---

### Task 0b: Create Regulation Reference System

**What to ask Claude Code:**

```
Build a regulation reference management system:

1. Database schema for regulations:
   - regulation_documents table (id, title, source, version, effective_date, pdf_path, summary)
   - regulation_sections table (id, document_id, section_number, title, content_summary, relevance_tags)
   - compliance_requirements table (id, section_id, requirement_text, applies_to, due_frequency, penalty_for_non_compliance)

2. Admin interface to:
   - Upload regulation PDFs
   - Tag sections by topic (e.g., "asset management", "drinking water quality", "reporting")
   - Link requirements to software features
   - Track when regulations are updated

3. API endpoints:
   - GET /api/regulations (list all)
   - GET /api/regulations/:id/requirements
   - GET /api/regulations/search (full-text search)

This becomes your "source of truth" for compliance requirements.
```

**Your role after:**
- Review each regulation and tag relevant sections
- Map requirements to your software features
- This is time-consuming but CRITICAL - don't skip it

---

## PHASE 0: PROJECT SCAFFOLDING

### Task 1: Initialize Backend Project Structure

**Before asking Claude Code, prepare:**
- Have your /docs folder populated with regulations
- Review key regulatory documents yourself
- Note which features require regulatory compliance

**What to ask Claude Code:**

```
Create a Node.js backend project with TypeScript, Fastify, and Prisma ORM. 

IMPORTANT: This is for NZ water utility compliance software. 
Review these regulation documents before generating code:
- /docs/regulations/taumata-arowai/drinking-water-quality-assurance-rules.pdf
- /docs/regulations/local-water-done-well/implementation-guide.pdf

Structure should include:
- src/ directory with controllers, services, routes, middleware
- Prisma schema setup for PostgreSQL
- Environment variable configuration
- ESLint and Prettier config
- Jest testing setup
- Docker compose for local PostgreSQL and Redis
- README with setup instructions

Key compliance considerations:
- Audit logging (regulatory requirement)
- Data retention policies (7-year minimum for compliance records)
- Role-based access (regulatory scrutiny requirements)

Follow Node.js best practices and use modern ES modules.
```

**Why this matters:** By referencing the regulation documents, Claude Code can incorporate compliance-specific requirements (like audit logging) from the start, rather than retrofitting later.

---

## PHASE 1: CORE FUNCTIONALITY WITH REGULATORY COMPLIANCE

### Task 4: Database Schema Implementation

**Preparation:** 
1. Read the Drinking Water Quality Assurance Rules sections on record-keeping
2. Read Local Water Done Well guidance on asset registers
3. Document exact data retention requirements

**What to ask Claude Code:**

```
Implement a Prisma schema for a water utility compliance management system.

CRITICAL: Review these regulatory documents first:
- /docs/regulations/taumata-arowai/drinking-water-quality-assurance-rules.pdf
  (Sections on record-keeping requirements)
- /docs/regulations/asset-management-plan-guidelines.pdf
  (Required asset data fields)

Based on regulatory requirements, the schema must support:

1. Data Retention:
   - Compliance records: 7-year retention minimum (Taumata Arowai requirement)
   - Audit logs: Immutable, cannot be deleted (regulatory audit requirement)
   - Soft deletes for most records (maintain history)

2. Required Fields (from regulations):
   For Assets:
   - All fields specified in Section X of asset management guidelines
   - Installation date, expected life, replacement value (valuation requirements)
   - GPS coordinates (emergency response requirement)
   
   For Drinking Water Safety Plans:
   - Fields specified in Taumata Arowai DWSP template
   - Version tracking (must show plan evolution)
   - Approval signatures and dates

3. Audit Requirements:
   - Track WHO did WHAT, WHEN, and WHY for all changes
   - Cannot be modified or deleted
   - Include IP address and session information

Tables needed:
[your specific table requirements here]

Include proper relationships, indexes, constraints.
Add compliance-specific indexes for reporting queries.
Generate seed data that demonstrates regulatory compliance.
```

**What Claude Code will do:**
- Review the PDF documents you specified
- Extract regulatory requirements
- Design schema that meets compliance needs
- Add appropriate constraints and validations
- Generate migrations

**Your role after - MANDATORY CHECKS:**
- [ ] Verify all regulatory-required fields are present
- [ ] Check data retention periods match regulations
- [ ] Confirm audit log is immutable (no UPDATE or DELETE allowed)
- [ ] Test soft delete functionality
- [ ] Validate against actual Taumata Arowai DWSP template
- [ ] Have domain expert (compliance manager) review schema

**Why this approach is critical:** Claude Code can read the PDFs and extract requirements, but YOU must verify it understood correctly. Regulatory compliance errors are expensive.

---

### Task 5: Authentication & Authorization with Regulatory Requirements

**Preparation:**
1. Review "Compliance, Monitoring and Enforcement Strategy" document
2. Note who is allowed to approve/submit compliance documents
3. Document organizational roles (Inspector, Manager, Regulator)

**What to ask Claude Code:**

```
Create authentication and authorization middleware for Fastify backend.

IMPORTANT: Review /docs/regulations/compliance-monitoring-enforcement.pdf
Section on "Roles and Responsibilities" to understand approval hierarchies.

Requirements based on regulatory framework:

1. Roles (from regulation):
   - System Admin (internal only)
   - Organization Admin (council management)
   - Compliance Manager (can submit to regulator)
   - Inspector (field staff, data entry only)
   - Auditor (read-only, regulator role)

2. Key Permissions (regulatory requirements):
   - Only Compliance Managers can submit plans to Taumata Arowai
   - Auditors must have read access to all data (regulatory audit rights)
   - Inspectors cannot delete historical records (data integrity)
   - Multi-person approval for critical changes (segregation of duties)

3. Audit Trail:
   - Log every permission check (who tried to access what)
   - Log authentication events (login/logout with IP)
   - Failed access attempts (security requirement)

4. Session Management:
   - Timeout after 30 minutes inactive (security best practice for govt systems)
   - Force re-authentication for critical actions (submission to regulator)

Include TypeScript types and comprehensive tests including:
- Attempt to bypass permissions (should fail)
- Cross-organizational data access (should fail)
- Auditor access to all organizations (should succeed)
```

**What Claude Code will do:**
- Review regulatory document for role requirements
- Implement RBAC system matching regulatory framework
- Add audit logging for compliance
- Generate security tests

**Your role after - SECURITY REVIEW:**
- [ ] Test every permission combination
- [ ] Verify cross-tenant isolation works
- [ ] Confirm auditors can access all data (but not modify)
- [ ] Test failed access attempts are logged
- [ ] Have security expert review (mandatory for auth code)
- [ ] Verify against actual Taumata Arowai inspection procedures

---

### Task 6: Compliance Plan Module with Regulatory Templates

**Preparation:**
1. Get actual Taumata Arowai Drinking Water Safety Plan template (Word/PDF)
2. Extract all required sections and fields
3. Map template structure to your data model

**What to ask Claude Code:**

```
Create Drinking Water Safety Plan (DWSP) management module.

CRITICAL: Reference these documents:
- /docs/templates/taumata-arowai-dwsp-template.docx
- /docs/regulations/drinking-water-quality-assurance-rules.pdf (Section 3: DWSPs)

The DWSP module must match Taumata Arowai's exact template structure.

Required sections (from template):
1. Water Supply Description
2. Hazardous Event Identification (Table 3.1 format)
3. Risk Assessment (using Taumata Arowai risk matrix)
4. Preventive Measures (Table 3.2 format)
5. Operational Monitoring (Table 3.3 format)
6. Verification Monitoring (Table 3.4 format)
7. Corrective Actions (Table 3.5 format)
8. Management and Communication
9. Document Control

Each section has specific required fields - extract from template.

Compliance features:
- Version control (track every change for regulatory audit)
- Approval workflow (draft → review → approved → submitted)
- Digital signatures (legal requirement for submission)
- Export to PDF matching Taumata Arowai format exactly
- Submission tracking (date submitted, acknowledgment received)
- Annual review reminder (DWSPs must be reviewed annually)

API endpoints:
- CRUD for plans
- Section-by-section editing
- Status transitions with approval logic
- PDF generation
- Submission to regulator (API integration if available)

Include validation:
- Required fields per section (from template)
- Risk matrix validation (must use approved methodology)
- Completeness check before submission
```

**What Claude Code will do:**
- Parse the DWSP template
- Extract all required fields and sections
- Build data models matching template
- Create validation rules
- Generate PDF that looks like official template

**Your role after - CRITICAL VALIDATION:**
- [ ] Print generated PDF next to official template - must match exactly
- [ ] Fill out sample DWSP using your software
- [ ] Have compliance manager review (does it meet requirements?)
- [ ] Submit test DWSP to Taumata Arowai (get feedback before launching)
- [ ] Verify all required sections present
- [ ] Check risk matrix matches approved methodology
- [ ] Test export format (regulator must be able to read it)

**This is the most critical module:** Getting DWSP wrong means customers can't submit compliance documents. Test extensively.

---

### Task 13: Reporting System with Regulatory Report Templates

**Preparation:**
1. Collect all regulatory report formats:
   - Taumata Arowai annual compliance report
   - Information disclosure templates
   - CCO performance reports
2. Extract required data fields and calculations
3. Document submission deadlines

**What to ask Claude Code:**

```
Implement regulatory reporting system.

MUST REVIEW these report templates:
- /docs/templates/taumata-arowai-annual-compliance-report.xlsx
- /docs/templates/information-disclosure-template.xlsx
- /docs/regulations/information-disclosure-requirements.pdf

Generate these specific regulatory reports:

1. Taumata Arowai Annual Compliance Report:
   - Extract exact format from template spreadsheet
   - Include all required metrics (extract from template)
   - Calculate compliance percentages per regulatory formula
   - Generate Excel output matching template exactly (colors, headers, formulas)

2. Information Disclosure Report (Commerce Commission):
   - Format specified in regulation
   - Financial and operational metrics
   - Must match prescribed format

3. Asset Management Plan Summary:
   - Format from Local Water Done Well guidelines
   - Required sections from regulation

Backend:
- Report template management (store template definitions)
- Data aggregation queries (regulatory metrics)
- Excel generation (using ExcelJS library to match official formats)
- PDF generation (for plans and summaries)
- Scheduled report generation (run automatically before deadlines)
- Submission tracking

Frontend:
- Report builder (select type, date range, organization)
- Data preview (verify before generating)
- Download in regulatory format
- Submission status tracking
- Deadline calendar (show upcoming reports due)

Compliance features:
- Validate data completeness before generating
- Audit log of report generation (who, when, what data)
- Version control (track report versions submitted)
- Archive reports (7-year retention as required)
```

**What Claude Code will do:**
- Parse official Excel/PDF templates
- Extract required fields and formulas
- Build data aggregation logic
- Generate outputs matching official formats exactly

**Your role after - VERIFICATION:**
- [ ] Generate test report using your software
- [ ] Compare side-by-side with official template
- [ ] Verify calculations match regulatory formulas
- [ ] Check all required fields populate correctly
- [ ] Test with incomplete data (should warn user)
- [ ] Have finance/compliance team review output
- [ ] Do trial submission to regulator (test acceptance)

**Common pitfall:** Generated reports look similar but have subtle differences (wrong calculations, missing fields, different formatting). Regulators reject submissions with format errors. Match templates exactly.

---

## ONGOING: REGULATORY COMPLIANCE MAINTENANCE

### Task: Quarterly Regulation Review Process

**What to ask Claude Code:**

```
Create a regulatory update monitoring system:

1. Script to check these sources quarterly:
   - Taumata Arowai website (legislation/guidance pages)
   - Department of Internal Affairs (Local Water Done Well updates)
   - Ministry of Health (drinking water standards)
   - Water Services Regulator website
   - Standards NZ (water-related standards)

2. For each source:
   - Check publication dates against our last check
   - Download any new documents
   - Generate change report (what's new)
   - Create tasks in project management system
   - Email notification to product manager

3. Compliance impact assessment template:
   - What changed in regulation?
   - Which features affected?
   - Required code changes?
   - Timeline for implementation?
   - Customer communication needed?

4. Documentation:
   - Update /docs/regulations/change-log.md
   - Link new requirements to code

Schedule to run automatically first week of each quarter.
```

**Your role:**
- Review change reports quarterly
- Assess impact of regulatory changes
- Prioritize necessary updates
- Communicate changes to customers
- Update software to maintain compliance

**Critical:** Regulations change. Your software must evolve with them. Don't wait for customers to tell you about regulatory updates.

---

## SUMMARY: Working with Regulations in Claude Code

**The Pattern for Every Regulatory Feature:**

1. **You prepare:**
   - Read the relevant regulation/template yourself
   - Extract key requirements
   - Document in plain language
   - Identify potential edge cases

2. **You ask Claude Code:**
   - Reference specific regulation documents
   - Quote specific section numbers
   - Provide clear acceptance criteria
   - Request validation against official templates

3. **Claude Code generates:**
   - Code implementing regulatory requirements
   - Based on actual regulation text
   - With compliance checks built-in

4. **You verify (MANDATORY):**
   - Compare output to official templates/requirements
   - Test with compliance manager/domain expert
   - Do trial submission to regulator
   - Document any deviations and why

**Never trust blindly:** Claude Code can read and interpret regulations, but:
- It might misunderstand nuance
- Regulations have implicit requirements not explicitly stated
- Context matters (how regulators actually interpret rules)
- You are legally responsible for compliance, not Claude Code

**The goal:** Leverage Claude Code's ability to process regulatory documents quickly, but maintain human oversight for correctness and compliance.

**What Claude Code will do:**
- Generate complete folder structure
- Create package.json with all dependencies
- Set up tsconfig.json
- Create docker-compose.yml
- Generate sample .env.example
- Create initial configuration files

**Your role after:**
- Review the generated structure
- Adjust any naming conventions
- Add project-specific environment variables
- Run `npm install` to verify dependencies

### Task 2: Initialize Frontend Project

**What to ask Claude Code:**

```
Create a Next.js 14 frontend with TypeScript and TailwindCSS.
Structure should include:
- App router structure
- shadcn/ui component library setup
- API client utility with Axios
- React Query configuration
- Auth0 integration boilerplate
- Zustand store setup
- Form handling with React Hook Form and Zod
- README with development instructions

Follow Next.js best practices.
```

**What Claude Code will do:**
- Generate Next.js project structure
- Install and configure all dependencies
- Set up TailwindCSS and shadcn/ui
- Create utility files and hooks
- Generate boilerplate layouts

**Your role after:**
- Verify the setup works (`npm run dev`)
- Customize theme colors in Tailwind config
- Add your Auth0 credentials to env

### Task 3: Infrastructure as Code

**What to ask Claude Code:**

```
Create Terraform configuration for AWS infrastructure including:
- VPC with public/private subnets across 2 AZs
- RDS PostgreSQL instance (Multi-AZ)
- ElastiCache Redis cluster
- S3 buckets for documents and backups
- Security groups with proper rules
- IAM roles for ECS tasks
- Variables file for customization

Follow AWS and Terraform best practices.
```

**What Claude Code will do:**
- Generate .tf files with proper structure
- Create variables and outputs
- Include comments explaining each resource
- Set up backend configuration for state

**Your role after:**
- Review security group rules carefully
- Adjust instance sizes for your budget
- Configure AWS credentials
- Run terraform plan before apply

---

## PHASE 1: CORE FUNCTIONALITY

### Task 4: Database Schema Implementation

**Preparation:** Create a written specification of your database schema with all tables, columns, relationships, and constraints.

**What to ask Claude Code:**

```
Implement a Prisma schema for a water utility compliance management system.

Tables needed:
1. Organizations: id, name, type (enum), region, population_served
2. Users: id, auth0_id, email, first_name, last_name, organization_id
3. Assets: id, organization_id, type (enum), name, location (coordinates), 
   installation_date, condition_rating, metadata (json)
4. Documents: id, organization_id, title, document_type, file_key, 
   file_size, version, parent_document_id, tags, created_by
5. Compliance_Plans: id, organization_id, plan_type, status, due_date, 
   submitted_at, metadata
6. Audit_Logs: id, organization_id, user_id, action, resource_type, 
   resource_id, changes (json), ip_address, created_at

Include proper relationships, indexes, and constraints.
Generate seed data script with sample records.
```

**What Claude Code will do:**
- Create complete schema.prisma file
- Define all models with proper types
- Set up relationships and indexes
- Generate migration files
- Create seed script

**Your role after:**
- Review schema carefully
- Run `prisma generate` to create client
- Run migration on dev database
- Test seed data

### Task 5: Authentication & Authorization Middleware

**What to ask Claude Code:**

```
Create authentication and authorization middleware for Fastify backend.

Requirements:
- JWT token verification (Auth0 issued tokens)
- Extract user from database based on auth0_id in token
- Attach user object to request
- Permission checking middleware (RBAC)
- Support for resource-level permissions
- Error handling for 401/403 cases

Include TypeScript types and unit tests.
```

**What Claude Code will do:**
- Create middleware files
- Implement token verification logic
- Add permission checking functions
- Generate tests
- Add TypeScript types

**Your role after:**
- Configure Auth0 public keys
- Test with real Auth0 tokens
- Adjust permission logic for your use case

### Task 6: API Endpoints - Assets Module

**What to ask Claude Code:**

```
Create RESTful API endpoints for asset management:
- GET /api/assets (list with filters, pagination)
- GET /api/assets/:id (get single asset)
- POST /api/assets (create asset)
- PATCH /api/assets/:id (update asset)
- DELETE /api/assets/:id (soft delete)
- POST /api/assets/bulk-import (CSV import)

Use controller-service pattern.
Include input validation with Zod schemas.
Add error handling.
Include integration tests.
Assets belong to organizations and require authentication.
```

**What Claude Code will do:**
- Create controller, service, and route files
- Implement CRUD operations
- Add validation schemas
- Generate tests
- Include error handling

**Your role after:**
- Test each endpoint with Postman
- Verify authorization rules work
- Check validation catches bad inputs
- Test pagination and filtering

### Task 7: File Upload with S3

**What to ask Claude Code:**

```
Implement secure file upload system using S3 presigned URLs:
- POST /api/documents/upload-url (generate presigned URL)
- POST /api/documents (create document record after upload)
- GET /api/documents/:id/download (get signed download URL)

Include:
- File type validation
- Size limit checks
- S3 SDK integration
- Error handling
- TypeScript types

Frontend component for file upload with progress bar.
```

**What Claude Code will do:**
- Create backend endpoints
- Implement S3 presigned URL generation
- Create React component for upload
- Add progress indication
- Include error handling

**Your role after:**
- Configure AWS S3 credentials
- Set up CORS on S3 bucket
- Test upload/download flow
- Verify file security (private bucket)

### Task 8: Background Job System

**What to ask Claude Code:**

```
Set up BullMQ job queue system for background tasks:
- Queue configuration with Redis
- Worker for report generation
- Job status tracking
- Retry logic for failed jobs
- Progress updates
- API endpoints to create and check job status

Include example: compliance report generation job
```

**What Claude Code will do:**
- Set up BullMQ configuration
- Create queue and worker files
- Implement job handlers
- Add status checking endpoints
- Include error handling and retries

**Your role after:**
- Configure Redis connection
- Test job creation and processing
- Monitor queue with BullMQ dashboard
- Adjust retry logic

---

## PHASE 2: USER INTERFACE

### Task 9: Dashboard Layout and Navigation

**What to ask Claude Code:**

```
Create a dashboard layout for Next.js app with:
- Responsive sidebar navigation with icons
- Top header with user dropdown and notifications
- Main content area
- Breadcrumb navigation
- Mobile-responsive (hamburger menu)

Use TailwindCSS and shadcn/ui components.
Include routing structure for: Dashboard, Assets, Documents, 
Compliance Plans, Reports, Settings.

Dark mode support.
```

**What Claude Code will do:**
- Create layout components
- Implement navigation logic
- Add mobile responsiveness
- Set up routing structure
- Include dark mode toggle

**Your role after:**
- Customize colors and branding
- Add your logo
- Test on different screen sizes
- Adjust navigation items

### Task 10: Asset Management UI

**What to ask Claude Code:**

```
Create asset management pages:

1. Asset List Page:
   - Data table with sorting, filtering, pagination
   - Search functionality
   - Action buttons (edit, delete)
   - "Create Asset" button
   - Export to CSV

2. Asset Detail Page:
   - Asset information display
   - Map showing location (use Mapbox or Leaflet)
   - Related documents list
   - Edit button

3. Asset Form (Create/Edit):
   - Form with validation (React Hook Form + Zod)
   - File upload for photos
   - Location picker (map or address search)
   - Save and cancel buttons

Use shadcn/ui components. Include loading and error states.
```

**What Claude Code will do:**
- Create all page components
- Implement forms with validation
- Add data fetching with React Query
- Create table with all features
- Include map integration

**Your role after:**
- Connect to your API endpoints
- Add Mapbox/Leaflet API key
- Test all CRUD operations
- Customize form fields

### Task 11: Document Management UI

**What to ask Claude Code:**

```
Create document management interface:

1. Document Library:
   - Grid/list view toggle
   - Filter by type, date, tags
   - Search bar
   - Upload button with drag-and-drop
   - Bulk actions (download, delete)

2. Upload Modal:
   - Drag-and-drop file upload
   - Multiple file support
   - Progress bars
   - Metadata form (title, type, tags)
   - Preview before saving

3. Document Viewer:
   - Display document metadata
   - Download button
   - Version history
   - Related documents

Use shadcn/ui components.
```

**What Claude Code will do:**
- Create all UI components
- Implement file upload with progress
- Add drag-and-drop functionality
- Create filter and search
- Include document viewer

**Your role after:**
- Connect upload to S3 presigned URLs
- Test with different file types
- Verify download works
- Customize metadata fields

### Task 12: Compliance Plan Builder

**What to ask Claude Code:**

```
Create multi-step form wizard for compliance plan creation:

Steps:
1. Plan Type Selection
2. Risk Assessment
3. Control Measures
4. Monitoring Requirements
5. Review and Submit

Features:
- Progress indicator
- Save draft at each step
- Validation per step
- Previous/Next navigation
- Auto-save every 30 seconds
- Template selector (pre-fill sections)

Use React Hook Form with Zod validation.
```

**What Claude Code will do:**
- Create wizard component structure
- Implement step navigation
- Add form validation
- Create auto-save functionality
- Include progress tracking

**Your role after:**
- Define validation rules for each step
- Create compliance plan templates
- Test full workflow
- Add field help text

---

## PHASE 3: ADVANCED FEATURES

### Task 13: Reporting System

**What to ask Claude Code:**

```
Implement report generation system:

Backend:
- Report template management
- Data aggregation queries
- PDF generation with Puppeteer
- Async job processing
- Report storage in S3

Frontend:
- Report builder UI (select type, date range, filters)
- Data preview table
- Generate button
- Job progress indicator
- Download when ready
- Report history list

Include example: Asset Condition Report template
```

**What Claude Code will do:**
- Create report generation logic
- Implement PDF rendering
- Add job queue integration
- Create UI components
- Include templates

**Your role after:**
- Design report templates (HTML/CSS)
- Test with real data
- Verify PDF output quality
- Add more report types

### Task 14: Audit Logging System

**What to ask Claude Code:**

```
Implement comprehensive audit logging:

Backend:
- Middleware to capture all mutations
- Log user actions, IP, timestamp
- Store before/after values (JSON diff)
- Audit log API endpoints (query, filter, export)

Frontend:
- Audit log viewer page
- Filters (user, action, date range, resource type)
- Timeline view
- Export functionality
- Detail modal

Include retention policy (archive after 90 days).
```

**What Claude Code will do:**
- Create audit logging middleware
- Implement storage and querying
- Build viewer UI
- Add filtering and export
- Include archival logic

**Your role after:**
- Test logging captures all actions
- Verify no sensitive data logged
- Test audit viewer performance
- Set up archival schedule

### Task 15: Notification System

**What to ask Claude Code:**

```
Create notification system:

Backend:
- Notification service (email and in-app)
- SendGrid integration for emails
- Notification templates
- Schedule notifications (deadline reminders)
- Notification preferences API

Frontend:
- Notification bell icon with badge
- Notification dropdown
- Mark as read functionality
- Notification preferences page
- Toast notifications for real-time alerts

Include: Deadline reminder (7 days before), Assignment notification,
Status change notification.
```

**What Claude Code will do:**
- Create notification service
- Implement email sending
- Build notification UI
- Add preferences system
- Include templates

**Your role after:**
- Configure SendGrid credentials
- Customize email templates
- Test notification delivery
- Set up cron jobs for scheduled notifications

---

## PHASE 4: TESTING & QUALITY

### Task 16: Unit Tests for Services

**What to ask Claude Code:**

```
Write comprehensive unit tests for backend services:
- AssetService (all methods)
- DocumentService
- CompliancePlanService
- UserService

Use Jest with proper mocking.
Cover edge cases and error scenarios.
Aim for 80%+ code coverage.
Include setup/teardown for test database.
```

**What Claude Code will do:**
- Generate test files for all services
- Mock dependencies (Prisma, S3, etc.)
- Write test cases for happy and error paths
- Add test utilities and helpers

**Your role after:**
- Run tests and verify they pass
- Add tests for business-specific logic
- Fix any failing tests
- Review coverage reports

### Task 17: Integration Tests for API

**What to ask Claude Code:**

```
Create integration tests for API endpoints:
- Test authentication/authorization
- Test all CRUD operations
- Test error responses (404, 403, 400)
- Test pagination and filtering
- Test file upload flow

Use Supertest with test database.
Include test data fixtures.
Clean up after each test.
```

**What Claude Code will do:**
- Generate integration test files
- Create test fixtures
- Write comprehensive test cases
- Add setup/teardown logic

**Your role after:**
- Run full test suite
- Add edge cases specific to your domain
- Verify tests are isolated (don't interfere)
- Add to CI pipeline

### Task 18: End-to-End Tests

**What to ask Claude Code:**

```
Create E2E tests with Playwright:
- User login flow
- Create asset workflow
- Upload document workflow
- Generate report workflow
- Form validation scenarios

Include screenshots on failure.
Run in headless mode for CI.
```

**What Claude Code will do:**
- Generate Playwright test files
- Write test scenarios
- Add assertions and waits
- Include error handling

**Your role after:**
- Run tests locally
- Fix any flaky tests
- Add more user journeys
- Integrate into CI/CD

---

## PHASE 5: DEPLOYMENT & OPERATIONS

### Task 19: CI/CD Pipeline

**What to ask Claude Code:**

```
Create GitHub Actions workflows:

1. CI Pipeline (on pull request):
   - Install dependencies
   - Run linters (ESLint, Prettier)
   - Run unit tests
   - Run integration tests
   - Build Docker images
   - Report coverage

2. CD Pipeline (on merge to main):
   - Build and push Docker images to ECR
   - Deploy to staging environment
   - Run smoke tests
   - Manual approval gate for production
   - Deploy to production
   - Post-deployment health checks

Include separate workflows for backend and frontend.
```

**What Claude Code will do:**
- Create .github/workflows/*.yml files
- Configure all steps
- Add caching for speed
- Include notifications

**Your role after:**
- Add GitHub secrets (AWS credentials, etc.)
- Test pipeline with a PR
- Adjust deployment targets
- Set up approval requirements

### Task 20: Monitoring and Alerting

**What to ask Claude Code:**

```
Set up monitoring configuration:

1. Health check endpoint:
   - /health (basic health)
   - /health/db (database connectivity)
   - /health/redis (Redis connectivity)
   - /health/s3 (S3 access)

2. Metrics collection:
   - API response times
   - Error rates
   - Database query times
   - Job queue length

3. Logging structure:
   - Structured JSON logs
   - Request ID tracking
   - Error context

4. Alerting rules:
   - Error rate > 5%
   - API latency > 2s
   - Failed jobs > 10 per hour

Config for Datadog or similar APM tool.
```

**What Claude Code will do:**
- Create health check endpoints
- Add metrics collection
- Structure logging
- Generate alerting config

**Your role after:**
- Deploy to staging
- Configure Datadog/monitoring tool
- Test alerts trigger correctly
- Set up on-call rotation

---

## WORKING EFFECTIVELY WITH CLAUDE CODE

### Best Practices

**1. Be Specific and Detailed**
- Bad: "Create user authentication"
- Good: "Create JWT-based authentication middleware for Fastify that verifies Auth0 tokens, loads user from PostgreSQL, attaches to request object, and returns 401 if invalid"

**2. Provide Context**
- Tell Claude Code about your tech stack
- Explain constraints (budget, performance requirements)
- Mention coding standards you follow

**3. Break Down Large Tasks**
- Don't ask for entire application at once
- Request one feature or module at a time
- Build incrementally and test as you go

**4. Review Everything**
- Claude Code generates code, but you're responsible for quality
- Review for security issues
- Test thoroughly
- Refactor if needed

**5. Iterate**
- First version might not be perfect
- Ask Claude Code to refactor or improve
- Request specific changes: "Make this function more efficient" or "Add error handling here"

### What to Review Carefully

**Security:**
- Authentication logic
- Authorization checks
- Input validation
- SQL injection prevention (Prisma helps but check raw queries)
- File upload restrictions
- API rate limiting

**Performance:**
- Database queries (use indexes)
- N+1 query problems
- Large file handling
- Memory leaks
- Caching strategies

**Business Logic:**
- Domain-specific rules
- Edge cases
- Error handling
- Data consistency

### When to Write Code Yourself (Critical Limitations)

**NEVER delegate these to Claude Code - YOU must do them:**

**1. Complex Architectural Decisions**
- Choosing between monolith vs. microservices
- Database schema design (let Claude Code implement it, but YOU design it first)
- Authentication/authorization architecture
- Data flow and system boundaries
- Scaling strategies
- Technology stack selection

**Why:** These decisions have long-term consequences. Wrong architecture is expensive to fix later. Claude Code doesn't understand your business constraints, growth plans, or team capabilities.

**How to handle:**
- Research and design architecture yourself (or with architect)
- Document decisions in Architecture Decision Records (ADRs)
- Create diagrams (system architecture, data flow, ER diagrams)
- Then ask Claude Code to implement based on your design

**Example - CORRECT approach:**
```
You design:
"Users belong to Organizations. Assets belong to Organizations. 
Users can only see assets in their organization. 
Multi-tenant architecture with row-level security.
PostgreSQL with organization_id on every table."

Then ask Claude Code:
"Implement this multi-tenant database schema in Prisma 
following this design: [paste design]"
```

**2. Domain-Specific Business Logic (Water Compliance)**

**Critical areas requiring YOUR expertise:**

**Regulatory Requirements:**
- Taumata Arowai compliance rules
- Drinking Water Safety Plan requirements
- Asset classification standards
- Inspection frequency rules
- Risk assessment methodologies
- Report submission formats

**Why:** Claude Code knows general programming, not NZ water regulations. It will generate plausible-looking but potentially incorrect compliance logic.

**How to handle:**
- Work with domain experts (compliance managers, regulators)
- Document exact rules in plain language
- Create decision trees for complex logic
- Write pseudocode or flowcharts
- THEN ask Claude Code to implement

**Example - WRONG:**
```
❌ "Create compliance risk assessment function"
// Claude Code will invent plausible but wrong rules
```

**Example - CORRECT:**
```
✓ You document:
"Risk Level Calculation:
1. If asset is critical AND condition ≤ 2 → High Risk
2. If asset is critical AND condition = 3 → Medium Risk  
3. If asset is non-critical AND condition ≤ 1 → Medium Risk
4. Otherwise → Low Risk

Critical assets defined as: treatment plants, 
main transmission lines >600mm diameter"

Then ask Claude Code:
"Implement this exact risk calculation logic: [paste rules]
Return 'high', 'medium', or 'low'"
```

**Domain Knowledge Checklist - YOU must define:**
- [ ] Asset types and their properties
- [ ] Compliance deadlines and calculation rules
- [ ] Report templates and required fields
- [ ] Approval workflows (who can approve what)
- [ ] Risk scoring formulas
- [ ] Notification trigger conditions
- [ ] Audit requirements (what to log)

**3. Critical Security Implementations**

**NEVER blindly trust Claude Code for:**

**Authentication & Authorization:**
- Permission models
- Token handling and storage
- Session management
- Role hierarchies
- Cross-tenant data access prevention

**Data Security:**
- Encryption implementations
- Key management
- PII handling
- Data retention policies
- Backup security

**API Security:**
- Rate limiting algorithms
- Input sanitization
- SQL injection prevention
- XSS prevention
- CSRF protection

**Why:** Security bugs can destroy your business. Data breaches = lawsuits, regulatory fines, reputation loss. Claude Code might miss edge cases or use outdated patterns.

**How to handle:**

**Step 1: Design security model yourself**
- Map out permissions (who can do what)
- Define data access boundaries
- Document sensitive data fields
- Create threat model

**Step 2: Ask Claude Code to implement**
- Provide exact specifications
- Request multiple security layers

**Step 3: MANDATORY security review**
- Review every line of generated auth/security code
- Test with attack scenarios
- Use security scanning tools (npm audit, Snyk)
- Get external security audit before production

**Security Review Checklist:**
After Claude Code generates security code, YOU must verify:

**Authentication:**
- [ ] Tokens expire appropriately (not 10 years!)
- [ ] Refresh token rotation implemented
- [ ] Password requirements enforced
- [ ] Rate limiting on login attempts
- [ ] MFA cannot be bypassed
- [ ] Session invalidation on logout works

**Authorization:**
- [ ] Users can only access their organization's data
- [ ] Permission checks on EVERY endpoint
- [ ] No permission escalation vulnerabilities
- [ ] Admin functions properly restricted
- [ ] API endpoints have authorization middleware

**Input Validation:**
- [ ] All user inputs validated (never trust user input)
- [ ] File upload types restricted
- [ ] File size limits enforced
- [ ] SQL injection impossible (using Prisma prepared statements)
- [ ] XSS prevention (React escapes by default, but check)

**Data Protection:**
- [ ] Sensitive data encrypted at rest
- [ ] TLS 1.3 for all connections
- [ ] Database credentials in secrets manager (not .env files)
- [ ] S3 buckets are private
- [ ] API keys rotated regularly

**Common Security Mistakes Claude Code Might Make:**

1. **Insufficient permission checks:**
```typescript
❌ WRONG (Claude Code might generate):
async getAsset(id: string) {
  return await prisma.asset.findUnique({ where: { id } });
  // No check if user can access this asset!
}

✓ CORRECT (You must ensure):
async getAsset(id: string, userId: string) {
  const user = await getUser(userId);
  const asset = await prisma.asset.findUnique({ where: { id } });
  
  if (asset.organizationId !== user.organizationId) {
    throw new ForbiddenError();
  }
  return asset;
}
```

2. **Weak token expiry:**
```typescript
❌ WRONG:
expiresIn: '30d' // 30 days is too long

✓ CORRECT:
expiresIn: '15m' // 15 minutes for access token
refreshTokenExpiresIn: '7d' // 7 days for refresh token
```

3. **Missing rate limiting:**
```typescript
❌ WRONG:
app.post('/api/auth/login', loginHandler);

✓ CORRECT:
app.post('/api/auth/login', 
  rateLimiter({ max: 5, window: '15m' }), // 5 attempts per 15 min
  loginHandler
);
```

4. **Direct file path access:**
```typescript
❌ WRONG:
const filePath = `/uploads/${req.params.filename}`;
// User could pass "../../etc/passwd"

✓ CORRECT:
const fileKey = sanitizeFilename(req.params.filename);
const file = await getFromS3(fileKey);
// No file system access
```

**When to Get Professional Security Help:**

You MUST hire security expert for:
- Pre-launch security audit
- Penetration testing
- Compliance certifications (SOC 2)
- After any security incident

Don't rely solely on Claude Code or your own knowledge for security.

---

**Additional Safeguards - Mandatory Practices:**

**Code Review Process:**
1. Claude Code generates code
2. YOU review every line (don't just copy-paste)
3. Another team member reviews (pair programming)
4. Run automated security scans
5. Test with malicious inputs
6. Only then commit to repository

**Test Security:**
Ask Claude Code to generate security tests:
```
"Create security tests that attempt:
- SQL injection attacks
- XSS attacks  
- Permission bypass attempts
- Cross-tenant data access
- JWT token manipulation
- File upload attacks

Tests should FAIL if vulnerabilities exist."
```

**Principle: Trust but Verify**
- Claude Code accelerates development
- But YOU are responsible for correctness and security
- Never deploy generated code without understanding it
- When in doubt, write it yourself or get expert review

---

## EXAMPLE WORKFLOW

Here's a typical development workflow using Claude Code:

### 1. Plan Feature
You (manually):
- Write feature specification
- Design database changes if needed
- Sketch UI mockups
- Define API contract

### 2. Generate Backend
Ask Claude Code:
```
Implement backend for [feature] following this spec:
[paste specification]

Include:
- Prisma model changes (migration)
- Service layer with business logic
- API endpoints with validation
- Unit tests
- Error handling

Tech stack: Node.js, TypeScript, Fastify, Prisma
```

### 3. Review & Test Backend
You:
- Review generated code
- Run tests
- Test API with Postman
- Fix any issues or ask Claude Code to refine

### 4. Generate Frontend
Ask Claude Code:
```
Create frontend for [feature] following this design:
[describe UI/UX]

Connect to these API endpoints:
[list endpoints]

Tech stack: Next.js, TypeScript, TailwindCSS, React Query
Use shadcn/ui components
```

### 5. Review & Test Frontend
You:
- Review generated code
- Test in browser
- Check responsiveness
- Refine styling

### 6. Integration Test
You:
- Test full feature end-to-end
- Check edge cases
- Verify error handling
- Load test if needed

### 7. Deploy
You:
- Commit to Git
- Create pull request
- CI pipeline runs (set up by Claude Code earlier)
- Review and merge
- Deploy to staging, then production

---

## TROUBLESHOOTING

### Claude Code isn't generating what you expected

**Solutions:**
- Be more specific in your prompt
- Provide examples of what you want
- Show existing code for context
- Break down into smaller tasks

### Generated code has bugs

**Solutions:**
- Describe the bug to Claude Code: "This function fails when X happens. Fix it."
- Ask for more tests: "Add tests to catch this edge case"
- Request code review: "Review this code for potential bugs"

### Performance issues

**Solutions:**
- Ask Claude Code: "Optimize this function for performance"
- Profile the code yourself, then ask for specific improvements
- Request caching strategies
- Ask for database query optimization

### Code doesn't match your style

**Solutions:**
- Provide style guide: "Follow these conventions: [list rules]"
- Ask for refactoring: "Refactor this to match our code style"
- Generate .eslintrc and .prettierrc configs upfront

---

## FINAL TIPS

1. **Start Small:** Begin with simple tasks to learn how Claude Code works
2. **Iterate:** First version doesn't have to be perfect
3. **Test Everything:** Claude Code can write tests too
4. **Learn from Generated Code:** Use it as a learning opportunity
5. **Maintain Control:** You're the architect, Claude Code is your assistant
6. **Document as You Go:** Ask Claude Code to generate documentation
7. **Version Control:** Commit frequently, review diffs carefully
8. **Security First:** Never compromise on security for speed

Building a SaaS with Claude Code can accelerate development significantly, but you still need to understand what you're building, make architectural decisions, and ensure quality. Use it as a powerful tool in your toolkit, not a replacement for engineering judgment.