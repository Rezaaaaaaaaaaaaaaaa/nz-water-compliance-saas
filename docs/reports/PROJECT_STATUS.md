# NZ Water Compliance SaaS - Project Status

## Overview

This project is a comprehensive regulatory compliance management system for NZ water utilities to meet Taumata Arowai requirements.

**Status:** Phase 0 - Foundation Complete | Phase 1 - In Progress

**Created:** 2025-10-03

---

## ✅ Completed Tasks

### Phase 0: Project Scaffolding

1. **Documentation System** ✓
   - Created folder structure for NZ regulations
   - Built document download and organization script
   - Metadata tracking system
   - Regulatory document index

2. **Backend Infrastructure** ✓
   - Node.js + TypeScript + Fastify setup
   - Prisma ORM configuration
   - Docker Compose for local development (PostgreSQL + Redis)
   - ESLint, Prettier, Jest configuration
   - Health check endpoints
   - Logging system with Pino
   - Environment configuration with validation

3. **Frontend Foundation** ✓
   - Next.js 14 with App Router
   - TypeScript + TailwindCSS
   - React Query, Zustand, React Hook Form
   - Zod validation

4. **Infrastructure as Code** ✓
   - Terraform configuration for AWS
   - VPC with multi-AZ subnets
   - RDS PostgreSQL (Multi-AZ for production)
   - ElastiCache Redis
   - S3 buckets (documents, backups, logs)
   - ECS Fargate for containers
   - Application Load Balancer
   - CloudWatch monitoring
   - IAM roles and policies

5. **Database Schema** ✓
   - **Comprehensive Prisma schema with:**
     - Organizations & Users (RBAC)
     - Assets (water infrastructure)
     - Documents (version control, S3 integration)
     - Compliance Plans (DWSP structure)
     - Audit Logs (immutable, 7-year retention)
     - Reports & Notifications
   - **Regulatory compliance features:**
     - Soft deletes for data retention
     - Audit trail for all changes
     - Role-based access control
     - Multi-tenant isolation
   - Seed script with sample data

---

## 🚧 In Progress

### Phase 1: Core Functionality

- Authentication & Authorization middleware (RBAC)
- Drinking Water Safety Plan (DWSP) management module
- Assets module API endpoints
- File upload system (S3 presigned URLs)
- Background job system (BullMQ)
- Regulatory reporting system

---

## 📋 Pending Tasks

### Phase 1: Core Functionality (Continued)
- [ ] Authentication & Authorization middleware with RBAC
- [ ] Drinking Water Safety Plan (DWSP) management module
- [ ] Assets module API endpoints (CRUD)
- [ ] File upload system with S3 presigned URLs
- [ ] Background job system with BullMQ
- [ ] Regulatory reporting system (backend)

### Phase 2: User Interface
- [ ] Dashboard layout and navigation
- [ ] Asset management UI pages
- [ ] Document management interface
- [ ] Compliance plan builder (multi-step wizard)
- [ ] Reporting system UI

### Phase 3: Advanced Features
- [ ] Comprehensive audit logging system
- [ ] Notification system (email and in-app)

### Phase 4: Testing & Quality
- [ ] Unit tests for backend services
- [ ] Integration tests for API endpoints
- [ ] End-to-end tests with Playwright

### Phase 5: Deployment & Operations
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Monitoring and alerting system
- [ ] Quarterly regulation review monitoring system

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js 18+ with TypeScript
- Fastify (web framework)
- Prisma (ORM)
- PostgreSQL (database)
- Redis (cache/queue)
- BullMQ (job queue)
- AWS S3 (file storage)
- Pino (logging)

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- React Query
- Zustand (state management)
- React Hook Form + Zod

**Infrastructure:**
- AWS (ECS, RDS, ElastiCache, S3, ALB)
- Terraform (IaC)
- Docker
- GitHub Actions (CI/CD)

### Database Design

Key entities:
- **Organizations**: Multi-tenant structure
- **Users**: Role-based access (System Admin, Org Admin, Compliance Manager, Inspector, Auditor)
- **Assets**: Water infrastructure with condition tracking
- **Documents**: Versioned documents with S3 storage
- **Compliance Plans**: DWSP structure matching Taumata Arowai requirements
- **Audit Logs**: Immutable logs with 7-year retention
- **Reports**: Automated regulatory reports
- **Notifications**: Deadline reminders and alerts

### Regulatory Compliance Features

1. **Audit Logging**
   - All data changes logged
   - Immutable records
   - 7-year retention (2555 days)
   - WHO, WHAT, WHEN, WHY tracking

2. **Data Retention**
   - Soft deletes (maintain history)
   - 7-year minimum for compliance records
   - Automated archival

3. **RBAC (Role-Based Access Control)**
   - 5 roles: System Admin, Org Admin, Compliance Manager, Inspector, Auditor
   - Resource-level permissions
   - Cross-tenant isolation
   - Auditor read-only access

4. **DWSP (Drinking Water Safety Plans)**
   - Structured per Taumata Arowai template
   - Hazard identification and risk assessment
   - Preventive measures tracking
   - Monitoring requirements
   - Approval workflows
   - Annual review reminders

---

## 📂 Project Structure

```
compliance-saas/
├── backend/                 # Node.js + Fastify API
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, etc.
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utilities
│   │   ├── jobs/           # Background jobs
│   │   └── tests/          # Tests
│   ├── prisma/             # Database schema & migrations
│   │   ├── schema.prisma   # ✅ Complete
│   │   └── seed.ts         # ✅ Sample data
│   ├── docker-compose.yml  # ✅ PostgreSQL + Redis
│   └── package.json        # ✅ Dependencies configured
│
├── frontend/               # Next.js 14 application
│   ├── app/                # App router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities
│   ├── hooks/              # Custom hooks
│   └── package.json        # ✅ Dependencies installed
│
├── infrastructure/         # Terraform IaC
│   └── terraform/          # ✅ AWS configuration
│       ├── main.tf
│       ├── variables.tf
│       └── modules/        # TODO: Create modules
│
├── docs/                   # Regulatory documentation
│   ├── regulations/        # ✅ Folder structure created
│   ├── templates/          # ✅ Compliance templates
│   ├── README.md           # ✅ Documentation guide
│   └── index.md            # ✅ Document inventory
│
└── scripts/                # Utility scripts
    ├── download-regulations.js  # ✅ Document downloader
    └── package.json        # ✅ Script dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- AWS account (for deployment)
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Local Development

1. **Install Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ../scripts && npm install
   ```

2. **Start Infrastructure**
   ```bash
   cd backend
   npm run docker:up
   ```

3. **Configure Environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Setup Database**
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

6. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

7. **Download Regulations** (Optional)
   ```bash
   cd scripts
   npm run download-regulations
   ```

---

## 📝 Next Steps

### Immediate Priorities

1. **Authentication & Authorization**
   - Implement JWT middleware
   - RBAC permission system
   - Auth0 integration (optional)
   - Session management

2. **Core API Endpoints**
   - Assets CRUD operations
   - Documents upload/download
   - Compliance plans management
   - User management

3. **DWSP Module**
   - DWSP creation wizard
   - Risk assessment tools
   - Approval workflow
   - PDF export matching Taumata Arowai template

4. **File Upload**
   - S3 presigned URLs
   - Upload progress tracking
   - File type validation
   - Virus scanning integration

5. **Background Jobs**
   - Report generation
   - Email notifications
   - Scheduled tasks
   - Job monitoring

---

## ⚠️ Important Notes

### Security Reminders

- [ ] Change JWT_SECRET in production (32+ characters)
- [ ] Configure AWS IAM roles (no hardcoded credentials)
- [ ] Enable MFA on AWS root account
- [ ] Set up CloudTrail for audit logging
- [ ] Configure VPC security groups
- [ ] Enable S3 bucket encryption
- [ ] Use AWS Secrets Manager for sensitive values
- [ ] Regular security audits

### Compliance Reminders

- [ ] Review actual Taumata Arowai regulations (don't rely solely on AI)
- [ ] Validate DWSP template matches official format exactly
- [ ] Test submission to regulator before launch
- [ ] Have compliance manager review all features
- [ ] Verify 7-year data retention works
- [ ] Test audit log immutability
- [ ] Confirm all regulatory reports match required formats

### Regulatory Documents

Critical documents to obtain manually:
- Water Services Act 2021 (full text)
- Taumata Arowai Drinking Water Quality Assurance Rules
- Official DWSP template (Word/PDF)
- Annual compliance report template
- Information disclosure requirements
- Standards New Zealand water standards (may require purchase)

---

## 📊 Progress Tracking

**Overall Completion:** ~25% (6/25 tasks complete)

**Phase Breakdown:**
- Phase 0 (Scaffolding): 100% ✅
- Phase 1 (Core): 20% 🚧
- Phase 2 (UI): 0% ⏳
- Phase 3 (Advanced): 0% ⏳
- Phase 4 (Testing): 0% ⏳
- Phase 5 (Deployment): 0% ⏳

**Estimated Time to MVP:** 6-8 weeks with dedicated development

---

## 🤝 Contributing

This is a compliance-critical system. All changes require:
1. Code review
2. Security review for auth/permission changes
3. Regulatory compliance verification
4. Testing (unit + integration)
5. Documentation updates

---

## 📧 Contact

For project questions:
- Technical: dev@compliance-saas.co.nz
- Compliance: compliance@compliance-saas.co.nz
- Infrastructure: devops@compliance-saas.co.nz

---

**Last Updated:** 2025-10-03
**Next Review:** Weekly during active development
