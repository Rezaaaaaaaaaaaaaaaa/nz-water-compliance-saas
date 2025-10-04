# IAM Module Variables

variable "project_name" {
  description = "Project name to prefix resources"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "secrets_arns" {
  description = "List of AWS Secrets Manager secret ARNs"
  type        = list(string)
  default     = ["*"]
}

variable "documents_bucket_arn" {
  description = "ARN of the S3 documents bucket"
  type        = string
}

variable "backups_bucket_arn" {
  description = "ARN of the S3 backups bucket"
  type        = string
}

variable "from_email_address" {
  description = "Verified SES email address for sending emails"
  type        = string
}

variable "enable_rds_monitoring" {
  description = "Enable RDS enhanced monitoring IAM role"
  type        = bool
  default     = true
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC flow logs IAM role"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
