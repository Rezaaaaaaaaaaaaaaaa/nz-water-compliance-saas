#!/bin/bash

# Generate Production Environment Variables
# Creates secure .env file for production deployment

set -e

echo "🔐 NZ Water Compliance SaaS - Environment Generator"
echo "==================================================="
echo ""
echo "This script will help you generate production environment variables."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Output file
ENV_FILE=".env.production"

# Check if file exists
if [ -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}Warning: $ENV_FILE already exists.${NC}"
  read -p "Overwrite? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
  rm "$ENV_FILE"
fi

echo "# Production Environment Variables" > "$ENV_FILE"
echo "# Generated on: $(date)" >> "$ENV_FILE"
echo "# DO NOT COMMIT THIS FILE TO GIT!" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"

# Function to prompt for value
prompt_value() {
  local var_name=$1
  local description=$2
  local default_value=$3
  local is_secret=$4

  echo ""
  echo -e "${GREEN}$var_name${NC}"
  echo "$description"

  if [ -n "$default_value" ]; then
    echo "Default: $default_value"
  fi

  if [ "$is_secret" = "true" ]; then
    read -s -p "Value: " value
    echo
  else
    read -p "Value: " value
  fi

  if [ -z "$value" ] && [ -n "$default_value" ]; then
    value=$default_value
  fi

  echo "$var_name=$value" >> "$ENV_FILE"
}

# Function to generate secret
generate_secret() {
  local var_name=$1
  local length=$2

  echo ""
  echo -e "${GREEN}$var_name${NC}"
  echo "Generating random secret..."

  local secret=$(openssl rand -base64 $length | tr -d '\n')
  echo "$var_name=$secret" >> "$ENV_FILE"
  echo -e "${GREEN}✓ Generated${NC}"
}

echo "📝 Basic Configuration"
echo "======================"

prompt_value "NODE_ENV" "Environment (production/staging)" "production" false
prompt_value "PORT" "Server port" "5000" false

echo "" >> "$ENV_FILE"
echo "# Database Configuration" >> "$ENV_FILE"

echo ""
echo "📊 Database Configuration"
echo "========================="
echo "Format: postgresql://user:password@host:port/database"
prompt_value "DATABASE_URL" "PostgreSQL connection URL" "" true

echo "" >> "$ENV_FILE"
echo "# Redis Configuration" >> "$ENV_FILE"

echo ""
echo "🔴 Redis Configuration"
echo "======================"
echo "Format: redis://host:port or redis://user:password@host:port"
prompt_value "REDIS_HOST" "Redis host" "localhost" false
prompt_value "REDIS_PORT" "Redis port" "6379" false
prompt_value "REDIS_PASSWORD" "Redis password (leave empty if none)" "" true

echo "" >> "$ENV_FILE"
echo "# Security Configuration" >> "$ENV_FILE"

echo ""
echo "🔐 Security Configuration"
echo "========================="
generate_secret "JWT_SECRET" 64
prompt_value "JWT_EXPIRY" "JWT token expiry" "7d" false

echo "" >> "$ENV_FILE"
echo "# AWS Configuration" >> "$ENV_FILE"

echo ""
echo "☁️  AWS Configuration"
echo "====================="
echo "Required for S3 (document storage) and SES (email)"
read -p "Configure AWS? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  prompt_value "AWS_ACCESS_KEY_ID" "AWS Access Key ID" "" true
  prompt_value "AWS_SECRET_ACCESS_KEY" "AWS Secret Access Key" "" true
  prompt_value "AWS_REGION" "AWS Region" "ap-southeast-2" false
  prompt_value "AWS_S3_BUCKET" "S3 Bucket name for documents" "" false
else
  echo "# AWS_ACCESS_KEY_ID=your-key-id" >> "$ENV_FILE"
  echo "# AWS_SECRET_ACCESS_KEY=your-secret-key" >> "$ENV_FILE"
  echo "# AWS_REGION=ap-southeast-2" >> "$ENV_FILE"
  echo "# AWS_S3_BUCKET=your-bucket-name" >> "$ENV_FILE"
fi

echo "" >> "$ENV_FILE"
echo "# Email Configuration" >> "$ENV_FILE"

echo ""
echo "📧 Email Configuration"
echo "======================"
echo "Providers: console (testing), ses (AWS SES), sendgrid (SendGrid)"
prompt_value "EMAIL_PROVIDER" "Email provider" "console" false
prompt_value "FROM_EMAIL" "From email address" "noreply@compliance-saas.nz" false
prompt_value "FROM_NAME" "From name" "NZ Water Compliance" false

if [ "$EMAIL_PROVIDER" = "sendgrid" ]; then
  prompt_value "SENDGRID_API_KEY" "SendGrid API Key" "" true
fi

echo "" >> "$ENV_FILE"
echo "# Frontend Configuration" >> "$ENV_FILE"

echo ""
echo "🌐 Frontend Configuration"
echo "========================="
prompt_value "FRONTEND_URL" "Frontend URL" "https://app.compliance-saas.nz" false

echo "" >> "$ENV_FILE"
echo "# Monitoring Configuration (Optional)" >> "$ENV_FILE"

echo ""
echo "📊 Monitoring (Optional)"
echo "======================="
read -p "Configure Sentry for error tracking? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  prompt_value "SENTRY_DSN" "Sentry DSN" "" true
else
  echo "# SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx" >> "$ENV_FILE"
fi

echo "" >> "$ENV_FILE"
echo "# Logging Configuration" >> "$ENV_FILE"
echo "LOG_LEVEL=info" >> "$ENV_FILE"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Environment file created: $ENV_FILE${NC}"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "  1. DO NOT commit this file to git"
echo "  2. Store securely (1Password, AWS Secrets Manager, etc.)"
echo "  3. Use different secrets for each environment"
echo "  4. Rotate secrets regularly (every 90 days)"
echo ""
echo "Next steps:"
echo "  1. Review $ENV_FILE"
echo "  2. Copy to your server/platform"
echo "  3. For Railway: railway variables set"
echo "  4. For Render: Add via dashboard"
echo "  5. For AWS: Use AWS Secrets Manager"
echo ""

# Create .env.production.example (sanitized)
ENV_EXAMPLE="${ENV_FILE}.example"
echo "Creating example file: $ENV_EXAMPLE"

cat > "$ENV_EXAMPLE" << 'EOF'
# Production Environment Variables Example
# Copy this file to .env.production and fill in actual values

# Basic Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Security Configuration
JWT_SECRET=generate-with-openssl-rand-base64-64
JWT_EXPIRY=7d

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET=your-bucket-name

# Email Configuration
EMAIL_PROVIDER=console
FROM_EMAIL=noreply@your-domain.com
FROM_NAME=NZ Water Compliance
# SENDGRID_API_KEY=your-sendgrid-key (if using SendGrid)

# Frontend Configuration
FRONTEND_URL=https://app.your-domain.com

# Monitoring Configuration (Optional)
# SENTRY_DSN=your-sentry-dsn

# Logging Configuration
LOG_LEVEL=info
EOF

echo -e "${GREEN}✓ Example file created: $ENV_EXAMPLE${NC}"
echo ""
echo "You can commit $ENV_EXAMPLE to git as a template."
