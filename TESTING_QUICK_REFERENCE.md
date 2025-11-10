# Testing Quick Reference Card
**One-page cheat sheet for fast testing**

---

## 📋 Quick Commands

```bash
# ⚡ FASTEST - Pre-commit validation (30s)
./scripts/test-quick.sh

# 🔄 ITERATIVE - Watch mode for development
./scripts/test-watch.sh unit              # Unit tests only
./scripts/test-watch.sh integration       # Integration tests
./scripts/test-watch.sh file <path>       # Specific file

# 🐛 DEBUG - Specific tests with verbose output
./scripts/test-debug.sh <pattern>         # Unit tests
./scripts/test-debug.sh <pattern> --integration
./scripts/test-debug.sh <pattern> --bail  # Stop on first failure

# 🧪 COMPREHENSIVE - Full test suite (5-10min)
./scripts/test-all.sh                     # Everything
./scripts/test-all.sh --skip-e2e          # Skip slow E2E tests (3min)
./scripts/test-all.sh --bail              # Stop on first failure
```

---

## 🎯 When to Use What

| Situation | Command | Time |
|-----------|---------|------|
| Before commit | `test-quick.sh` | 30s |
| During development | `test-watch.sh unit` | Instant |
| Debugging failure | `test-debug.sh <pattern> --bail` | Variable |
| Before push | `test-all.sh --skip-e2e` | 3min |
| Before PR | `test-all.sh` | 8min |

---

## 🔄 Watch Mode Shortcuts

**In watch mode, press:**
- `a` → Run all tests
- `f` → Run only failed tests
- `p` → Filter by file pattern
- `t` → Filter by test name
- `q` → Quit

---

## 🐛 Debug Examples

```bash
# All asset tests
./scripts/test-debug.sh asset

# Auth login tests only
./scripts/test-debug.sh "auth.*login"

# With coverage
./scripts/test-debug.sh export --coverage

# Integration test
./scripts/test-debug.sh analytics --integration

# Stop on first error
./scripts/test-debug.sh dwsp --bail
```

---

## 💡 Development Workflows

### TDD Workflow
```bash
# 1. Start watch mode
./scripts/test-watch.sh unit

# 2. Write test → Code → Test passes
# 3. Repeat
# 4. Before commit:
./scripts/test-quick.sh
```

### Feature Workflow
```bash
# 1. Develop with watch
./scripts/test-watch.sh file backend/src/services/asset.service.test.ts

# 2. Quick check
./scripts/test-quick.sh

# 3. Before push
./scripts/test-all.sh --skip-e2e
```

### Bug Fix Workflow
```bash
# 1. Debug failing test
./scripts/test-debug.sh "bug-pattern" --bail

# 2. Fix with watch mode
./scripts/test-watch.sh unit

# 3. Verify
./scripts/test-debug.sh "bug-pattern" --integration
```

---

## 🐳 Docker Quick Commands

```bash
# Start services
cd backend && docker compose up -d

# Stop services
docker compose down

# Logs
docker compose logs -f postgres

# Reset database
docker compose down -v && docker compose up -d
npx prisma migrate deploy
```

---

## ⚙️ Useful npm Commands

```bash
cd backend

# Unit tests
npm test                    # Run once
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage

# Integration tests
npm run test:integration
npm run test:integration -- --watch

# Linting
npm run lint
npm run lint:fix

# Type checking
npx tsc --noEmit

# Build
npm run build
```

---

## 🔍 Troubleshooting

### Clean Everything
```bash
cd backend
rm -rf node_modules dist coverage
npm install
npx prisma generate
./scripts/test-quick.sh
```

### Restart Docker
```bash
cd backend
docker compose down
docker compose up -d
sleep 5
npx prisma migrate deploy
```

### Kill Ports
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:5432 | xargs kill -9
```

---

## 📊 Coverage

```bash
# Generate coverage
cd backend && npm test -- --coverage

# View in browser
open backend/coverage/lcov-report/index.html

# Coverage for specific test
./scripts/test-debug.sh asset --coverage
```

---

## 🎨 Color Legend

- 🟢 Green ✓ = Passed
- 🔴 Red ✗ = Failed
- 🟡 Yellow ⚠ = Warning
- 🔵 Blue ▶ = Running
- 🟣 Purple = Debug mode

---

## 🚀 Speed Tips

1. Use watch mode constantly (`test-watch.sh`)
2. Skip E2E during development (`test-all.sh --skip-e2e`)
3. Filter to your work area in watch mode (press `p`)
4. Use `--bail` to stop on first failure
5. Keep Docker running (don't restart between tests)

---

**See TESTING_GUIDE.md for full documentation**
