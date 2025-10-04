# IAM Module Outputs

output "ecs_execution_role_arn" {
  description = "The ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_execution.arn
}

output "ecs_execution_role_name" {
  description = "The name of the ECS task execution role"
  value       = aws_iam_role.ecs_execution.name
}

output "ecs_task_role_arn" {
  description = "The ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "ecs_task_role_name" {
  description = "The name of the ECS task role"
  value       = aws_iam_role.ecs_task.name
}

output "rds_monitoring_role_arn" {
  description = "The ARN of the RDS monitoring role"
  value       = var.enable_rds_monitoring ? aws_iam_role.rds_monitoring[0].arn : null
}

output "vpc_flow_logs_role_arn" {
  description = "The ARN of the VPC flow logs role"
  value       = var.enable_vpc_flow_logs ? aws_iam_role.vpc_flow_logs[0].arn : null
}

output "vpc_flow_logs_group_arn" {
  description = "The ARN of the VPC flow logs CloudWatch log group"
  value       = var.enable_vpc_flow_logs ? aws_cloudwatch_log_group.vpc_flow_logs[0].arn : null
}
