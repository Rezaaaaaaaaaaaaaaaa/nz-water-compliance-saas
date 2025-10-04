# S3 Module Variables

variable "project_name" {
  description = "Project name to prefix resources"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "allowed_origins" {
  description = "List of allowed origins for CORS (frontend URLs)"
  type        = list(string)
  default     = ["*"]
}

variable "enable_alb_logging" {
  description = "Enable ALB access logs to S3"
  type        = bool
  default     = true
}

variable "storage_alarm_threshold_gb" {
  description = "Storage size threshold in GB to trigger alarm"
  type        = number
  default     = 100
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
