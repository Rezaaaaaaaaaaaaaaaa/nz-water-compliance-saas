# Monitoring Module Outputs

output "sns_topic_arn" {
  description = "The ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "The name of the SNS alerts topic"
  value       = aws_sns_topic.alerts.name
}

output "dashboard_name" {
  description = "The name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "redis_slow_log_group_name" {
  description = "The name of the Redis slow log group"
  value       = aws_cloudwatch_log_group.redis_slow_log.name
}

output "redis_engine_log_group_name" {
  description = "The name of the Redis engine log group"
  value       = aws_cloudwatch_log_group.redis_engine_log.name
}

output "workers_log_group_name" {
  description = "The name of the workers log group"
  value       = aws_cloudwatch_log_group.workers.name
}

output "composite_alarm_arn" {
  description = "The ARN of the system health composite alarm"
  value       = aws_cloudwatch_composite_alarm.system_health.arn
}
