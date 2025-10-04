# Terraform Outputs for NZ Water Compliance SaaS

# VPC Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

# Database Outputs
output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.database.db_instance_endpoint
  sensitive   = true
}

output "database_address" {
  description = "RDS database address"
  value       = module.database.db_instance_address
}

output "database_port" {
  description = "RDS database port"
  value       = module.database.db_instance_port
}

output "database_name" {
  description = "RDS database name"
  value       = module.database.db_instance_name
}

output "database_connection_string" {
  description = "PostgreSQL connection string"
  value       = module.database.connection_string
  sensitive   = true
}

# Redis Outputs
output "redis_primary_endpoint" {
  description = "Redis primary endpoint address"
  value       = module.redis.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint address"
  value       = module.redis.reader_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = module.redis.port
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = module.redis.connection_string
  sensitive   = true
}

# S3 Outputs
output "documents_bucket_name" {
  description = "Name of the S3 documents bucket"
  value       = module.s3.documents_bucket_id
}

output "documents_bucket_arn" {
  description = "ARN of the S3 documents bucket"
  value       = module.s3.documents_bucket_arn
}

output "backups_bucket_name" {
  description = "Name of the S3 backups bucket"
  value       = module.s3.backups_bucket_id
}

output "logs_bucket_name" {
  description = "Name of the S3 logs bucket"
  value       = module.s3.logs_bucket_id
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.ecs.service_name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = module.ecs.ecr_repository_url
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "alb_url" {
  description = "URL of the Application Load Balancer"
  value       = module.alb.alb_url
}

output "alb_zone_id" {
  description = "Route53 zone ID of the ALB"
  value       = module.alb.alb_zone_id
}

# IAM Outputs
output "ecs_execution_role_arn" {
  description = "ARN of the ECS execution role"
  value       = module.iam.ecs_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = module.iam.ecs_task_role_arn
}

# Monitoring Outputs
output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = module.monitoring.dashboard_name
}

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = module.monitoring.sns_topic_arn
}

# Deployment Information
output "deployment_info" {
  description = "Important deployment information"
  value = {
    environment     = var.environment
    region          = var.aws_region
    alb_url         = module.alb.alb_url
    ecr_repository  = module.ecs.ecr_repository_url
    ecs_cluster     = module.ecs.cluster_name
    ecs_service     = module.ecs.service_name
  }
}

# Next Steps
output "next_steps" {
  description = "Next steps for deployment"
  value = <<-EOT

  📦 Deployment Next Steps:

  1. Build and push Docker image:
     docker build -t ${module.ecs.ecr_repository_url}:latest backend/
     aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${module.ecs.ecr_repository_url}
     docker push ${module.ecs.ecr_repository_url}:latest

  2. Run database migrations:
     ECS_TASK_ARN=$(aws ecs list-tasks --cluster ${module.ecs.cluster_name} --query 'taskArns[0]' --output text)
     aws ecs execute-command --cluster ${module.ecs.cluster_name} --task $ECS_TASK_ARN --container backend --interactive --command "/bin/sh"
     # Then run: npx prisma migrate deploy

  3. Access the application:
     ${module.alb.alb_url}

  4. Set up DNS (optional):
     Create a CNAME record pointing ${var.domain_name} to ${module.alb.alb_dns_name}

  5. Monitor the deployment:
     CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${module.monitoring.dashboard_name}

  EOT
}
