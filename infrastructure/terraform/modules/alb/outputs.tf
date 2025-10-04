# ALB Module Outputs

output "alb_id" {
  description = "The ID of the load balancer"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "The ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "alb_arn_suffix" {
  description = "The ARN suffix for use with CloudWatch Metrics"
  value       = aws_lb.main.arn_suffix
}

output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "The zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "security_group_id" {
  description = "The ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "target_group_arn" {
  description = "The ARN of the backend target group"
  value       = aws_lb_target_group.backend.arn
}

output "target_group_arn_suffix" {
  description = "The ARN suffix of the backend target group"
  value       = aws_lb_target_group.backend.arn_suffix
}

output "http_listener_arn" {
  description = "The ARN of the HTTP listener"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "The ARN of the HTTPS listener (if enabled)"
  value       = var.enable_https ? aws_lb_listener.https[0].arn : null
}

output "alb_url" {
  description = "The URL of the load balancer"
  value       = var.enable_https ? "https://${aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"
}
