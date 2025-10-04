# NZ Water Compliance SaaS - AWS Infrastructure
# Complete Terraform configuration using all custom modules

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# Local variables
locals {
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
    }
  )
}

# IAM Module (create first for roles)
module "iam" {
  source = "./modules/iam"

  project_name          = var.project_name
  aws_region            = var.aws_region
  documents_bucket_arn  = module.s3.documents_bucket_arn
  backups_bucket_arn    = module.s3.backups_bucket_arn
  from_email_address    = var.from_email_address
  enable_rds_monitoring = true
  enable_vpc_flow_logs  = false

  tags = local.common_tags
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  enable_nat_gateway = true
  enable_flow_logs   = false

  tags = local.common_tags
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  project_name    = var.project_name
  environment     = var.environment
  allowed_origins = ["https://${var.domain_name}", "https://www.${var.domain_name}"]
  enable_alb_logging = true
  storage_alarm_threshold_gb = 100
  alarm_actions   = [module.monitoring.sns_topic_arn]

  tags = local.common_tags
}

# Monitoring Module (create early for SNS topic)
module "monitoring" {
  source = "./modules/monitoring"

  project_name            = var.project_name
  aws_region              = var.aws_region
  alert_email_addresses   = var.alert_email_addresses
  enable_encryption       = true
  log_retention_days      = var.log_retention_days
  backend_log_group_name  = module.ecs.log_group_name

  tags = local.common_tags

  depends_on = [module.ecs]
}

# RDS PostgreSQL Module
module "database" {
  source = "./modules/rds"

  project_name            = var.project_name
  vpc_id                  = module.vpc.vpc_id
  vpc_cidr                = var.vpc_cidr
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_security_groups = [module.ecs.security_group_id]

  engine_version           = "15.4"
  instance_class           = var.db_instance_class
  allocated_storage        = var.db_allocated_storage
  database_name            = "compliance"
  master_username          = var.db_master_username
  master_password          = var.db_master_password
  multi_az                 = var.db_multi_az
  backup_retention_days    = var.db_backup_retention_days
  skip_final_snapshot      = var.environment != "production"
  deletion_protection      = var.environment == "production"

  monitoring_interval      = 60
  monitoring_role_arn      = module.iam.rds_monitoring_role_arn
  performance_insights_enabled = true

  alarm_actions            = [module.monitoring.sns_topic_arn]

  tags = local.common_tags

  depends_on = [module.vpc, module.iam, module.monitoring]
}

# ElastiCache Redis Module
module "redis" {
  source = "./modules/elasticache"

  project_name            = var.project_name
  vpc_id                  = module.vpc.vpc_id
  vpc_cidr                = var.vpc_cidr
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_security_groups = [module.ecs.security_group_id]

  engine_version           = "7.0"
  node_type                = var.redis_node_type
  num_cache_nodes          = var.redis_num_cache_nodes
  multi_az                 = true
  snapshot_retention_limit = 7
  skip_final_snapshot      = var.environment != "production"
  transit_encryption_enabled = true
  auth_token               = var.redis_auth_token

  slow_log_group_name      = module.monitoring.redis_slow_log_group_name
  engine_log_group_name    = module.monitoring.redis_engine_log_group_name
  sns_topic_arn            = module.monitoring.sns_topic_arn
  alarm_actions            = [module.monitoring.sns_topic_arn]

  tags = local.common_tags

  depends_on = [module.vpc, module.monitoring]
}

# ALB Module
module "alb" {
  source = "./modules/alb"

  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  backend_port       = 3001

  enable_deletion_protection = var.environment == "production"
  enable_access_logs         = true
  access_logs_bucket         = module.s3.logs_bucket_id

  enable_https    = var.enable_https
  certificate_arn = var.certificate_arn
  ssl_policy      = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  enable_waf      = false
  alarm_actions   = [module.monitoring.sns_topic_arn]

  tags = local.common_tags

  depends_on = [module.vpc, module.s3, module.monitoring]
}

# ECS Fargate Module
module "ecs" {
  source = "./modules/ecs"

  project_name           = var.project_name
  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  alb_security_group_ids = [module.alb.security_group_id]
  target_group_arn       = module.alb.target_group_arn
  alb_listener_arn       = var.enable_https ? module.alb.https_listener_arn : module.alb.http_listener_arn

  execution_role_arn = module.iam.ecs_execution_role_arn
  task_role_arn      = module.iam.ecs_task_role_arn

  enable_container_insights = true
  use_spot                  = false
  image_tag                 = var.ecs_image_tag
  container_port            = 3001

  task_cpu      = var.ecs_task_cpu
  task_memory   = var.ecs_task_memory
  desired_count = var.ecs_desired_count

  database_url   = "postgresql://${var.db_master_username}:${var.db_master_password}@${module.database.db_instance_address}:${module.database.db_instance_port}/compliance"
  redis_host     = module.redis.primary_endpoint_address
  redis_port     = module.redis.port
  s3_bucket_name = module.s3.documents_bucket_id
  aws_region     = var.aws_region

  secrets = [
    {
      name      = "JWT_SECRET"
      valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}/jwt-secret"
    }
  ]

  log_retention_days = var.log_retention_days

  enable_autoscaling        = var.ecs_enable_autoscaling
  autoscaling_min_capacity  = var.ecs_autoscaling_min
  autoscaling_max_capacity  = var.ecs_autoscaling_max
  autoscaling_cpu_target    = 70
  autoscaling_memory_target = 80

  alarm_actions = [module.monitoring.sns_topic_arn]

  tags = local.common_tags

  depends_on = [module.vpc, module.alb, module.database, module.redis, module.iam, module.monitoring]
}

# Data source for account ID
data "aws_caller_identity" "current" {}
