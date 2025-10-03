# NZ Water Compliance SaaS - AWS Infrastructure
# Terraform configuration for production-ready compliance management system

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state storage
  # Uncomment and configure for production use
  # backend "s3" {
  #   bucket         = "compliance-saas-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "ap-southeast-2"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "NZ-Water-Compliance-SaaS"
      ManagedBy   = "Terraform"
      Environment = var.environment
      Compliance  = "Taumata-Arowai"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = data.aws_availability_zones.available.names
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# RDS PostgreSQL Database
module "database" {
  source = "./modules/rds"

  environment             = var.environment
  db_name                 = var.db_name
  db_username             = var.db_username
  db_password             = var.db_password
  db_instance_class       = var.db_instance_class
  db_allocated_storage    = var.db_allocated_storage
  db_max_allocated_storage = var.db_max_allocated_storage
  vpc_id                  = module.vpc.vpc_id
  db_subnet_ids           = module.vpc.private_subnet_ids
  allowed_security_groups = [module.ecs.ecs_security_group_id]
  backup_retention_period = var.backup_retention_period
  multi_az                = var.environment == "production" ? true : false
}

# ElastiCache Redis Cluster
module "redis" {
  source = "./modules/elasticache"

  environment            = var.environment
  redis_node_type        = var.redis_node_type
  redis_num_cache_nodes  = var.redis_num_cache_nodes
  vpc_id                 = module.vpc.vpc_id
  redis_subnet_ids       = module.vpc.private_subnet_ids
  allowed_security_groups = [module.ecs.ecs_security_group_id]
}

# S3 Buckets for Document Storage
module "s3" {
  source = "./modules/s3"

  environment      = var.environment
  documents_bucket_name = "${var.project_name}-documents-${var.environment}"
  backups_bucket_name   = "${var.project_name}-backups-${var.environment}"
  logs_bucket_name      = "${var.project_name}-logs-${var.environment}"
}

# ECS Cluster and Services
module "ecs" {
  source = "./modules/ecs"

  environment                = var.environment
  vpc_id                     = module.vpc.vpc_id
  public_subnet_ids          = module.vpc.public_subnet_ids
  private_subnet_ids         = module.vpc.private_subnet_ids
  backend_image              = var.backend_image
  backend_cpu                = var.backend_cpu
  backend_memory             = var.backend_memory
  backend_desired_count      = var.backend_desired_count
  database_url               = module.database.connection_string
  redis_url                  = module.redis.redis_endpoint
  s3_bucket_name             = module.s3.documents_bucket_name
  jwt_secret                 = var.jwt_secret
  frontend_url               = var.frontend_url
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  certificate_arn    = var.certificate_arn
  target_group_arn   = module.ecs.target_group_arn
}

# CloudWatch Logs and Monitoring
module "monitoring" {
  source = "./modules/monitoring"

  environment             = var.environment
  log_retention_days      = var.log_retention_days
  alarm_email             = var.alarm_email
  rds_instance_id         = module.database.db_instance_id
  redis_cluster_id        = module.redis.redis_cluster_id
  alb_arn_suffix          = module.alb.alb_arn_suffix
  ecs_cluster_name        = module.ecs.cluster_name
  ecs_service_name        = module.ecs.service_name
}

# IAM Roles and Policies
module "iam" {
  source = "./modules/iam"

  environment      = var.environment
  s3_bucket_arns   = [module.s3.documents_bucket_arn, module.s3.backups_bucket_arn]
}

# Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.database.db_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.redis.redis_endpoint
  sensitive   = true
}

output "documents_bucket_name" {
  description = "S3 bucket for document storage"
  value       = module.s3.documents_bucket_name
}
