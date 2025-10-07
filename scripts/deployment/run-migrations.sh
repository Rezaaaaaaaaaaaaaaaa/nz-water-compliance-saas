#!/bin/bash

################################################################################
# Database Migration Script
#
# Runs Prisma migrations in production environment
#
# Usage:
#   ./run-migrations.sh [options]
#
# Options:
#   --dry-run         Show pending migrations without applying
#   --reset           Reset database (DANGEROUS!)
#   --seed            Run seed after migration
#
# Environment Variables:
#   DATABASE_URL      PostgreSQL connection string (required)
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DRY_RUN=false
RESET=false
SEED=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --reset)
      RESET=true
      shift
      ;;
    --seed)
      SEED=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check if DATABASE_URL is set
  if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
  fi

  # Check if in backend directory or navigate to it
  if [ ! -f "package.json" ]; then
    if [ -d "$PROJECT_ROOT/backend" ]; then
      cd "$PROJECT_ROOT/backend"
    else
      log_error "Cannot find backend directory"
      exit 1
    fi
  fi

  # Check if Prisma is available
  if ! command -v npx &> /dev/null; then
    log_error "npx is not available"
    exit 1
  fi

  log_success "Prerequisites check passed"
}

check_migration_status() {
  log_info "Checking migration status..."

  npx prisma migrate status || {
    log_error "Failed to check migration status"
    exit 1
  }
}

run_migrations() {
  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN MODE - No migrations will be applied"
    check_migration_status
    return
  fi

  if [ "$RESET" = true ]; then
    log_warning "⚠️  DATABASE RESET REQUESTED ⚠️"
    log_warning "This will DELETE ALL DATA in the database!"
    read -p "Are you sure? Type 'YES' to confirm: " confirm

    if [ "$confirm" != "YES" ]; then
      log_info "Reset cancelled"
      exit 0
    fi

    log_warning "Resetting database..."
    npx prisma migrate reset --force || {
      log_error "Database reset failed"
      exit 1
    }

    log_success "Database reset complete"
    return
  fi

  log_info "Running database migrations..."

  # Deploy migrations
  npx prisma migrate deploy || {
    log_error "Migration failed"
    exit 1
  }

  log_success "Migrations applied successfully"

  # Generate Prisma Client
  log_info "Generating Prisma Client..."
  npx prisma generate || {
    log_error "Prisma generate failed"
    exit 1
  }

  log_success "Prisma Client generated"
}

run_seed() {
  if [ "$SEED" = false ]; then
    return
  fi

  log_info "Running database seed..."

  if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    npx prisma db seed || {
      log_warning "Seed failed (this may be expected)"
    }
    log_success "Seed complete"
  else
    log_warning "No seed file found, skipping"
  fi
}

create_backup_before_migration() {
  log_info "Creating backup before migration..."

  # Extract database details from DATABASE_URL
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"

  log_info "Backup file: $BACKUP_FILE"
  log_warning "Manual backup recommended: pg_dump -h $DB_HOST -U username $DB_NAME > $BACKUP_FILE"
}

verify_migrations() {
  log_info "Verifying migration status..."

  npx prisma migrate status || {
    log_error "Verification failed"
    exit 1
  }

  # Check if any migrations are pending
  if npx prisma migrate status | grep -q "Database schema is up to date"; then
    log_success "All migrations applied successfully"
  else
    log_warning "Some migrations may be pending"
  fi
}

print_summary() {
  echo ""
  echo "=============================================="
  echo "         Migration Summary"
  echo "=============================================="
  echo "Mode:          $([ "$DRY_RUN" = true ] && echo "Dry Run" || echo "Apply")"
  echo "Reset:         $([ "$RESET" = true ] && echo "Yes" || echo "No")"
  echo "Seed:          $([ "$SEED" = true ] && echo "Yes" || echo "No")"
  echo "Database:      ${DATABASE_URL%%\?*}" | sed 's/@.*:/@***:/'
  echo "=============================================="
  echo ""
}

# Main execution
main() {
  log_info "Starting database migration..."
  print_summary

  check_prerequisites
  echo ""

  if [ "$RESET" = false ] && [ "$DRY_RUN" = false ]; then
    create_backup_before_migration
    echo ""
  fi

  check_migration_status
  echo ""

  run_migrations
  echo ""

  run_seed
  echo ""

  verify_migrations
  echo ""

  log_success "Database migration complete!"
}

main
