#!/bin/bash

################################################################################
# CloudWatch Alarms Setup Script
#
# Creates comprehensive monitoring alarms for FlowComply production
#
# Usage:
#   ./setup-cloudwatch-alarms.sh [options]
#
# Options:
#   --email <email>     Email address for alarm notifications
#   --dry-run           Show what would be created without creating
#   --delete-all        Delete all existing alarms (DANGEROUS!)
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
ALARM_EMAIL=""
DRY_RUN=false
DELETE_ALL=false
SNS_TOPIC_ARN=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --email)
      ALARM_EMAIL="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --delete-all)
      DELETE_ALL=true
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

  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed"
    exit 1
  fi

  if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured"
    exit 1
  fi

  if [ -z "$ALARM_EMAIL" ] && [ "$DRY_RUN" = false ]; then
    log_error "Email address is required (use --email)"
    exit 1
  fi

  log_success "Prerequisites check passed"
}

create_sns_topic() {
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would create SNS topic"
    SNS_TOPIC_ARN="arn:aws:sns:${AWS_REGION}:123456789012:flowcomply-alarms"
    return
  fi

  log_info "Creating SNS topic for alarms..."

  # Create SNS topic
  SNS_TOPIC_ARN=$(aws sns create-topic \
    --name flowcomply-production-alarms \
    --region ${AWS_REGION} \
    --query 'TopicArn' \
    --output text 2>/dev/null || \
    aws sns list-topics \
    --region ${AWS_REGION} \
    --query "Topics[?contains(TopicArn, 'flowcomply-production-alarms')].TopicArn" \
    --output text)

  log_info "SNS Topic: ${SNS_TOPIC_ARN}"

  # Subscribe email
  aws sns subscribe \
    --topic-arn ${SNS_TOPIC_ARN} \
    --protocol email \
    --notification-endpoint ${ALARM_EMAIL} \
    --region ${AWS_REGION} || log_warning "Email subscription may already exist"

  log_success "SNS topic configured"
  log_warning "Check your email (${ALARM_EMAIL}) to confirm subscription!"
}

create_alarm() {
  local alarm_name=$1
  local description=$2
  local namespace=$3
  local metric_name=$4
  local comparison=$5
  local threshold=$6
  local periods=$7
  local statistic=$8
  local dimensions=$9

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would create alarm: ${alarm_name}"
    return
  fi

  log_info "Creating alarm: ${alarm_name}..."

  aws cloudwatch put-metric-alarm \
    --alarm-name "${alarm_name}" \
    --alarm-description "${description}" \
    --metric-name "${metric_name}" \
    --namespace "${namespace}" \
    --statistic "${statistic}" \
    --period 300 \
    --evaluation-periods ${periods} \
    --threshold ${threshold} \
    --comparison-operator ${comparison} \
    --dimensions ${dimensions} \
    --alarm-actions "${SNS_TOPIC_ARN}" \
    --treat-missing-data notBreaching \
    --region ${AWS_REGION}

  log_success "Alarm created: ${alarm_name}"
}

# Critical Alarms (P1)
create_critical_alarms() {
  log_info "Creating CRITICAL alarms (P1)..."

  # High 5xx Error Rate
  create_alarm \
    "FlowComply-High-5xx-Error-Rate" \
    "5xx error rate exceeds 5%" \
    "AWS/ApplicationELB" \
    "HTTPCode_Target_5XX_Count" \
    "GreaterThanThreshold" \
    50 \
    2 \
    "Sum" \
    "Name=LoadBalancer,Value=app/flowcomply-prod-alb/..."

  # No Healthy Hosts
  create_alarm \
    "FlowComply-No-Healthy-Hosts" \
    "No healthy targets available" \
    "AWS/ApplicationELB" \
    "HealthyHostCount" \
    "LessThanThreshold" \
    1 \
    2 \
    "Average" \
    "Name=TargetGroup,Value=targetgroup/flowcomply-backend/..."

  # Database Connection Exhaustion
  create_alarm \
    "FlowComply-DB-Connections-High" \
    "Database connections > 90 (90% of max)" \
    "AWS/RDS" \
    "DatabaseConnections" \
    "GreaterThanThreshold" \
    90 \
    2 \
    "Average" \
    "Name=DBInstanceIdentifier,Value=flowcomply-production"

  # ECS Service Down
  create_alarm \
    "FlowComply-Backend-Service-Down" \
    "Backend service has no running tasks" \
    "AWS/ECS" \
    "RunningTaskCount" \
    "LessThanThreshold" \
    1 \
    2 \
    "Average" \
    "Name=ServiceName,Value=backend-service Name=ClusterName,Value=flowcomply-production"

  log_success "Critical alarms created"
}

# Warning Alarms (P2)
create_warning_alarms() {
  log_info "Creating WARNING alarms (P2)..."

  # High CPU (Backend)
  create_alarm \
    "FlowComply-Backend-High-CPU" \
    "Backend CPU utilization > 80%" \
    "AWS/ECS" \
    "CPUUtilization" \
    "GreaterThanThreshold" \
    80 \
    3 \
    "Average" \
    "Name=ServiceName,Value=backend-service Name=ClusterName,Value=flowcomply-production"

  # High Memory (Backend)
  create_alarm \
    "FlowComply-Backend-High-Memory" \
    "Backend memory utilization > 85%" \
    "AWS/ECS" \
    "MemoryUtilization" \
    "GreaterThanThreshold" \
    85 \
    3 \
    "Average" \
    "Name=ServiceName,Value=backend-service Name=ClusterName,Value=flowcomply-production"

  # Slow API Response
  create_alarm \
    "FlowComply-Slow-API-Response" \
    "API p95 response time > 2 seconds" \
    "AWS/ApplicationELB" \
    "TargetResponseTime" \
    "GreaterThanThreshold" \
    2 \
    2 \
    "p95" \
    "Name=LoadBalancer,Value=app/flowcomply-prod-alb/..."

  # Low Cache Hit Rate
  create_alarm \
    "FlowComply-Low-Cache-Hit-Rate" \
    "Redis cache hit rate < 60%" \
    "AWS/ElastiCache" \
    "CacheHitRate" \
    "LessThanThreshold" \
    60 \
    3 \
    "Average" \
    "Name=CacheClusterId,Value=flowcomply-production-redis"

  # High RDS CPU
  create_alarm \
    "FlowComply-RDS-High-CPU" \
    "RDS CPU utilization > 80%" \
    "AWS/RDS" \
    "CPUUtilization" \
    "GreaterThanThreshold" \
    80 \
    3 \
    "Average" \
    "Name=DBInstanceIdentifier,Value=flowcomply-production"

  log_success "Warning alarms created"
}

# Info Alarms (P3)
create_info_alarms() {
  log_info "Creating INFO alarms (P3)..."

  # Low Disk Space
  create_alarm \
    "FlowComply-RDS-Low-Disk-Space" \
    "RDS free storage < 10GB" \
    "AWS/RDS" \
    "FreeStorageSpace" \
    "LessThanThreshold" \
    10000000000 \
    1 \
    "Average" \
    "Name=DBInstanceIdentifier,Value=flowcomply-production"

  # High Redis Memory
  create_alarm \
    "FlowComply-Redis-High-Memory" \
    "Redis memory usage > 80%" \
    "AWS/ElastiCache" \
    "DatabaseMemoryUsagePercentage" \
    "GreaterThanThreshold" \
    80 \
    2 \
    "Average" \
    "Name=CacheClusterId,Value=flowcomply-production-redis"

  log_success "Info alarms created"
}

delete_all_alarms() {
  log_warning "Deleting ALL FlowComply alarms..."

  read -p "Are you sure? Type 'DELETE' to confirm: " confirm
  if [ "$confirm" != "DELETE" ]; then
    log_info "Deletion cancelled"
    exit 0
  fi

  # Get all FlowComply alarms
  ALARMS=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix "FlowComply-" \
    --query 'MetricAlarms[].AlarmName' \
    --output text \
    --region ${AWS_REGION})

  if [ -z "$ALARMS" ]; then
    log_info "No alarms to delete"
    return
  fi

  # Delete each alarm
  for alarm in $ALARMS; do
    log_info "Deleting: $alarm"
    aws cloudwatch delete-alarms \
      --alarm-names "$alarm" \
      --region ${AWS_REGION}
  done

  log_success "All alarms deleted"
}

list_alarms() {
  log_info "Current FlowComply alarms:"

  aws cloudwatch describe-alarms \
    --alarm-name-prefix "FlowComply-" \
    --query 'MetricAlarms[].[AlarmName,StateValue]' \
    --output table \
    --region ${AWS_REGION}
}

print_summary() {
  echo ""
  echo "=============================================="
  echo "   CloudWatch Alarms Setup Complete"
  echo "=============================================="
  echo "SNS Topic:     ${SNS_TOPIC_ARN}"
  echo "Email:         ${ALARM_EMAIL}"
  echo "Region:        ${AWS_REGION}"
  echo ""
  echo "Alarms Created:"
  echo "  Critical (P1): 4 alarms"
  echo "  Warning (P2):  5 alarms"
  echo "  Info (P3):     2 alarms"
  echo "  Total:         11 alarms"
  echo ""
  echo "⚠️  IMPORTANT:"
  echo "  1. Check your email to confirm SNS subscription"
  echo "  2. Update alarm dimensions with actual resource names"
  echo "  3. Test alarms to ensure notifications work"
  echo ""
  echo "=============================================="
}

# Main execution
main() {
  log_info "Setting up CloudWatch alarms..."
  echo ""

  check_prerequisites
  echo ""

  if [ "$DELETE_ALL" = true ]; then
    delete_all_alarms
    exit 0
  fi

  create_sns_topic
  echo ""

  create_critical_alarms
  echo ""

  create_warning_alarms
  echo ""

  create_info_alarms
  echo ""

  list_alarms
  echo ""

  print_summary
}

main
