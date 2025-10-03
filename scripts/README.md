# Scripts Directory

Utility scripts for the NZ Water Compliance SaaS project.

## 🚀 Deployment Scripts

### pre-deploy-check.sh

Pre-deployment verification script that checks if your system is ready for production deployment.

**Usage:**
```bash
./pre-deploy-check.sh
```

**Checks:**
- Required tools installed (Node.js, Docker, PostgreSQL, etc.)
- Project structure valid
- Dependencies installed
- No hardcoded secrets
- Tests passing
- Configuration files present

**Exit codes:**
- `0` - All checks passed
- `1` - Errors found, fix before deploying

---

### generate-env.sh

Interactive script to generate production environment variables.

**Usage:**
```bash
./generate-env.sh
```

**Features:**
- Interactive prompts for all required variables
- Generates secure secrets automatically
- Creates `.env.production` file
- Creates `.env.production.example` template
- Security best practices included

**Generated files:**
- `.env.production` - Actual production environment variables (DO NOT COMMIT)
- `.env.production.example` - Template for documentation (safe to commit)

---

### health-check.sh

Post-deployment health check script that verifies your deployment is working correctly.

**Usage:**
```bash
# Check localhost
./health-check.sh

# Check production
./health-check.sh https://api.compliance-saas.nz https://app.compliance-saas.nz
```

**Tests:**
- ✅ Backend API endpoints
- ✅ Frontend pages
- ✅ Security headers
- ✅ CORS configuration
- ✅ SSL certificates
- ✅ Response times
- ✅ User registration flow

**Exit codes:**
- `0` - All tests passed
- `1` - Some tests failed (80%+ pass rate)
- `2` - Too many failures (<80% pass rate)

---

## 📄 Data Scripts

### download-regulations.js

Downloads regulatory documents from Taumata Arowai website.

**Usage:**
```bash
npm install
node download-regulations.js
```

**Features:**
- Downloads all regulatory documents
- Saves to `../docs/regulations/` directory
- Generates download report with statistics
- Handles rate limiting and retries

**Requirements:**
- Node.js 18+
- Internet connection
- Write permissions to docs directory

---

## Quick Start

### Before Deployment

```bash
# 1. Run pre-deployment checks
./pre-deploy-check.sh

# 2. Generate environment variables
./generate-env.sh

# 3. Review generated .env.production file
cat .env.production
```

### After Deployment

```bash
# Run health checks
./health-check.sh https://api.your-domain.com https://app.your-domain.com
```

---

## Script Dependencies

### Required

- `bash` - All shell scripts
- `curl` - Health checks and HTTP requests
- `openssl` - Secret generation

### Optional

- `jq` - JSON parsing (improves health checks)
- `aws` - AWS CLI (for AWS deployment)
- `docker` - Container builds (for Docker deployment)

### Installing Dependencies

**macOS:**
```bash
brew install jq
brew install awscli
```

**Ubuntu/Debian:**
```bash
apt-get install jq
apt-get install awscli
```

**Windows (WSL):**
```bash
sudo apt-get install jq
sudo apt-get install awscli
```

---

## Troubleshooting

### "Permission denied" error

Make scripts executable:
```bash
chmod +x *.sh
```

### "command not found: jq"

Install jq or the script will fallback to grep-based parsing.

### Health check fails with "Connection refused"

Ensure your services are running:
```bash
# Check if backend is running
curl http://localhost:5000/health

# Check if frontend is running
curl http://localhost:3000
```

---

## Maintenance Schedule

**Quarterly (every 3 months):**
1. Run `npm run download-regulations` to check for new documents
2. Review any new or updated documents
3. Assess impact on software features
4. Update compliance requirements database
5. Communicate changes to stakeholders

---

## Contributing

When adding new scripts:

1. Add documentation to this README
2. Make scripts executable: `chmod +x script.sh`
3. Use proper error handling with `set -e`
4. Include usage examples
5. Document exit codes
6. Add to git: `git add script.sh`

---

## Support

For issues with scripts:
- Check script output for error messages
- Review script source code for usage details
- See main deployment guides: `PRODUCTION_DEPLOYMENT.md` and `QUICK_DEPLOY.md`
