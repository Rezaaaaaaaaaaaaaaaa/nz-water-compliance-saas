# ElastiCache Module Variables

variable "project_name" {
  description = "Project name to prefix resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where ElastiCache will be created"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block for security group rules"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for ElastiCache subnet group"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "List of security group IDs allowed to access Redis"
  type        = list(string)
  default     = []
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes in the cluster (2+ for Multi-AZ)"
  type        = number
  default     = 2
}

variable "multi_az" {
  description = "Enable Multi-AZ with automatic failover"
  type        = bool
  default     = true
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain automatic snapshots"
  type        = number
  default     = 7
}

variable "snapshot_window" {
  description = "Daily time range for snapshots (UTC)"
  type        = string
  default     = "03:00-05:00"
}

variable "maintenance_window" {
  description = "Weekly time range for maintenance (UTC)"
  type        = string
  default     = "sun:05:00-sun:07:00"
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying"
  type        = bool
  default     = false
}

variable "auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable encryption in transit (TLS)"
  type        = bool
  default     = true
}

variable "auth_token" {
  description = "Auth token for Redis (required when transit_encryption_enabled is true)"
  type        = string
  sensitive   = true
  default     = null
}

variable "slow_log_group_name" {
  description = "CloudWatch Log Group name for slow logs"
  type        = string
}

variable "engine_log_group_name" {
  description = "CloudWatch Log Group name for engine logs"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
  default     = ""
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarm triggers"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
