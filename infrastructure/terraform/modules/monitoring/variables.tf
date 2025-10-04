# Monitoring Module Variables

variable "project_name" {
  description = "Project name to prefix resources"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "alert_email_addresses" {
  description = "List of email addresses to receive alerts"
  type        = list(string)
  default     = []
}

variable "enable_encryption" {
  description = "Enable encryption for SNS topics"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "backend_log_group_name" {
  description = "Name of the backend CloudWatch log group"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
