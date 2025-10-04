# Terraform Variables for NZ Water Compliance SaaS

# Project Configuration
variable "project_name" {
  description = "Project name to prefix all resources"
  type        = string
  default     = "compliance-saas"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-southeast-2"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-southeast-2a", "ap-southeast-2b", "ap-southeast-2c"]
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_master_username" {
  description = "Master username for RDS"
  type        = string
  default     = "postgres"
}

variable "db_master_password" {
  description = "Master password for RDS (use AWS Secrets Manager in production)"
  type        = string
  sensitive   = true
}

variable "db_backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = true
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.small"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes in Redis cluster"
  type        = number
  default     = 2
}

variable "redis_auth_token" {
  description = "Auth token for Redis (use AWS Secrets Manager in production)"
  type        = string
  sensitive   = true
}

# ECS Configuration
variable "ecs_task_cpu" {
  description = "CPU units for ECS task (256, 512, 1024, 2048, 4096)"
  type        = string
  default     = "512"
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = string
  default     = "1024"
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_image_tag" {
  description = "Docker image tag for ECS"
  type        = string
  default     = "latest"
}

variable "ecs_enable_autoscaling" {
  description = "Enable ECS autoscaling"
  type        = bool
  default     = true
}

variable "ecs_autoscaling_min" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecs_autoscaling_max" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

# ALB Configuration
variable "enable_https" {
  description = "Enable HTTPS listener on ALB"
  type        = bool
  default     = true
}

variable "certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

# Monitoring Configuration
variable "alert_email_addresses" {
  description = "List of email addresses for CloudWatch alarms"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

# Application Configuration
variable "from_email_address" {
  description = "Verified SES email address for sending emails"
  type        = string
}

# Tags
variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "NZ Water Compliance SaaS"
    ManagedBy   = "Terraform"
    Compliance  = "Taumata Arowai"
  }
}
