# ElastiCache Module Outputs

output "replication_group_id" {
  description = "The ID of the ElastiCache Replication Group"
  value       = aws_elasticache_replication_group.main.id
}

output "replication_group_arn" {
  description = "The ARN of the ElastiCache Replication Group"
  value       = aws_elasticache_replication_group.main.arn
}

output "primary_endpoint_address" {
  description = "The address of the endpoint for the primary node"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "reader_endpoint_address" {
  description = "The address of the endpoint for the reader node"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "configuration_endpoint_address" {
  description = "The configuration endpoint address"
  value       = aws_elasticache_replication_group.main.configuration_endpoint_address
}

output "port" {
  description = "The port number on which the cache accepts connections"
  value       = aws_elasticache_replication_group.main.port
}

output "security_group_id" {
  description = "The security group ID of the ElastiCache cluster"
  value       = aws_security_group.redis.id
}

output "subnet_group_name" {
  description = "The name of the cache subnet group"
  value       = aws_elasticache_subnet_group.main.name
}

output "parameter_group_name" {
  description = "The name of the parameter group"
  value       = aws_elasticache_parameter_group.main.name
}

output "auth_token_enabled" {
  description = "Whether auth token (password) is enabled"
  value       = aws_elasticache_replication_group.main.auth_token_enabled
}

output "connection_string" {
  description = "Redis connection string"
  value       = "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:${aws_elasticache_replication_group.main.port}"
  sensitive   = true
}
