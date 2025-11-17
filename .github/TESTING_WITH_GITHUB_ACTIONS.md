# Testing with GitHub Actions

This guide explains how to use the GitHub Actions workflows and test them locally using `act`.

## 📋 Available Workflows

### 1. **PR Quick Check** (`pr-quick-check.yml`)
**Triggers:** Every pull request to `main` or `develop`

**What it does:**
- ✅ Runs configuration validation tests (catches port misconfigurations)
- ✅ Checks code formatting
- ✅ Runs TypeScript type checking
- ✅ Posts results as PR comment

**Speed:** ~2-3 minutes

**Purpose:** Fast feedback loop for developers - catches configuration bugs before full tests run.

---

### 2. **Comprehensive Test Suite** (`comprehensive-tests.yml`)
**Triggers:**
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`
- Manual trigger via workflow_dispatch

**What it does:**
- ✅ Configuration validation (25 tests)
- ✅ Environment validation (40+ tests)
- ✅ Unit tests (91+ tests)
- ✅ Integration tests (with real database)
- ✅ Connectivity tests (frontend-to-backend)
- ✅ Health check tests (35+ tests)
- ✅ API contract tests (40+ tests)
- ✅ Deployment smoke tests (30+ tests) - **Only on main branch**

**Speed:** ~15-20 minutes

**Purpose:** Complete validation that nothing is broken - catches ALL types of bugs.

---

## 🚀 Testing Workflows Locally with `act`

### Why Use `act`?

- ✅ Test workflows before pushing to GitHub
- ✅ Faster iteration (no waiting for GitHub runners)
- ✅ Works offline
- ✅ Save GitHub Actions minutes

### Installation

**Windows (using Scoop):**
```powershell
scoop install act
```

**Windows (using Chocolatey):**
```powershell
choco install act-cli
```

**macOS:**
```bash
brew install act
```

**Linux:**
```bash
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### Prerequisites

1. **Docker Desktop must be running**
   ```bash
   # Verify Docker is running
   docker info
   ```

2. **Create `.actrc` file** (optional but recommended)
   ```bash
   # Create in project root
   echo "-P ubuntu-latest=catthehacker/ubuntu:act-latest" > .actrc
   ```

---

## 📖 Usage Examples

### 1. List Available Workflows

```bash
act -l
```

**Output:**
```
Stage  Job ID                     Job name
0      quick-validation           Quick Validation (Config + Lint)
0      config-validation          Configuration Validation
0      environment-validation     Environment Validation
1      unit-tests                 Unit Tests
2      integration-tests          Integration Tests
```

### 2. Run PR Quick Check

```bash
# Run the quick validation job
act pull_request -j quick-validation
```

**What happens:**
- Simulates a PR event
- Runs configuration validation
- Runs linting and type checking
- Shows results in terminal

### 3. Run Configuration Validation Only

```bash
# Run just config tests
act pull_request -j config-validation
```

**Perfect for:**
- After changing `.env` files
- Before committing configuration changes
- Quick validation (< 1 minute)

### 4. Run All PR Jobs

```bash
# Run all jobs that would run on a PR
act pull_request
```

**What happens:**
- Runs config-validation
- Runs environment-validation
- Runs unit-tests
- Runs integration-tests (if dependencies succeed)
- Full PR simulation

### 5. Run Full Comprehensive Tests

```bash
# Run everything including smoke tests
act push --job deployment-smoke-tests
```

**Note:** This requires all services and takes ~15-20 minutes.

### 6. Test Specific Workflow File

```bash
# Test the comprehensive tests workflow
act -W .github/workflows/comprehensive-tests.yml

# Test the PR quick check workflow
act -W .github/workflows/pr-quick-check.yml
```

---

## 🔧 Advanced `act` Usage

### Dry Run (See What Would Run)

```bash
# See what would run without actually running
act -n
```

### Use Specific Docker Platform

```bash
# For M1/M2 Macs or ARM machines
act --container-architecture linux/amd64
```

### Pass Secrets

```bash
# Create secrets file
cat > .secrets <<EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/test
JWT_SECRET=test-secret-key
EOF

# Run with secrets
act -s DATABASE_URL -s JWT_SECRET
```

### Run with Environment Variables

```bash
act --env NODE_ENV=test --env CI=true
```

### Debug Mode

```bash
# See detailed logs
act -v
```

### Reuse Docker Containers (Faster)

```bash
# Don't remove containers after run
act --reuse
```

---

## 💡 Recommended Workflow

### Before Creating a PR:

```bash
# 1. Run quick validation locally
act pull_request -j quick-validation

# 2. If that passes, run config and unit tests
act pull_request -j config-validation
act pull_request -j unit-tests

# 3. If all pass, create PR (GitHub will run full suite)
```

### After Changing Configuration:

```bash
# Always run config validation
act pull_request -j config-validation

# Then run environment validation
act pull_request -j environment-validation
```

### Before Merging to Main:

```bash
# Run integration tests locally
act push -j integration-tests

# Or run everything
act push
```

---

## 🎯 Which Tests Catch Which Bugs?

### Your Login Bug Would Be Caught By:

1. ✅ **config-validation** - "should have NEXT_PUBLIC_API_URL pointing to backend port 3000"
2. ✅ **config-validation** - "should NOT point to frontend port 3001 (common mistake)"
3. ✅ **connectivity-tests** - "should successfully authenticate with valid credentials"
4. ✅ **deployment-smoke-tests** - "should have backend service responding"

### Other Bug Categories:

- **Missing environment variables** → config-validation
- **Wrong Docker config** → environment-validation
- **Broken API contracts** → api-contract-tests
- **Database migration issues** → integration-tests
- **Health endpoint problems** → health-check-tests

---

## 📊 GitHub Actions Dashboard

Once workflows are set up, you can:

1. **View all runs:** `https://github.com/YOUR_ORG/YOUR_REPO/actions`
2. **Manually trigger:** Click "Run workflow" on comprehensive-tests.yml
3. **See PR status:** Checks appear on PRs automatically
4. **Download artifacts:** Test coverage reports available for 7 days

---

## ⚙️ Customization

### Modify Test Selection

Edit `.github/workflows/comprehensive-tests.yml`:

```yaml
- name: Run configuration validation tests
  working-directory: backend
  run: npm test -- --testPathPatterns=config-validation.test.ts
```

### Change Trigger Conditions

```yaml
# Only run on specific branches
on:
  pull_request:
    branches: [main]  # Remove develop

# Only run on specific paths
on:
  pull_request:
    paths:
      - 'backend/**'
      - '.github/workflows/**'
```

### Adjust Service Versions

```yaml
services:
  postgres:
    image: postgres:16-alpine  # Change version
```

---

## 🐛 Troubleshooting

### `act` Can't Find Docker

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
```bash
# Windows: Start Docker Desktop
# Linux: Start Docker service
sudo systemctl start docker
```

### Port Already in Use

**Error:** `port is already allocated`

**Solution:**
```bash
# Stop local services
docker-compose down

# Or use different ports in act
act --container-port 5433:5432
```

### Out of Disk Space

**Error:** `no space left on device`

**Solution:**
```bash
# Clean up Docker
docker system prune -a

# Clean up act containers
act --rm
```

### Tests Fail in `act` but Pass on GitHub

**Likely causes:**
- Different runner images
- Missing environment variables
- Port conflicts with local services

**Solution:**
```bash
# Use GitHub's exact runner image (slower but accurate)
act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:full-latest
```

---

## 📚 Additional Resources

- [act Documentation](https://github.com/nektos/act)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Our Comprehensive Test Report](../COMPREHENSIVE_TEST_COVERAGE_REPORT.md)

---

## ✅ Quick Reference

```bash
# Common commands
act -l                              # List all jobs
act pull_request                    # Run all PR jobs
act -j config-validation            # Run specific job
act -n                              # Dry run
act -v                              # Verbose mode
act --reuse                         # Reuse containers
act -W .github/workflows/pr-quick-check.yml  # Specific workflow

# Test before commit
act pull_request -j quick-validation

# Full local test
act push

# Debug a specific job
act -j connectivity-tests -v
```

---

**Pro Tip:** Add an npm script to `package.json`:

```json
{
  "scripts": {
    "test:github:quick": "act pull_request -j quick-validation",
    "test:github:config": "act pull_request -j config-validation",
    "test:github:all": "act pull_request"
  }
}
```

Then run: `npm run test:github:quick`
