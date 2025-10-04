# S3 Module Outputs

output "documents_bucket_id" {
  description = "The name of the documents bucket"
  value       = aws_s3_bucket.documents.id
}

output "documents_bucket_arn" {
  description = "The ARN of the documents bucket"
  value       = aws_s3_bucket.documents.arn
}

output "documents_bucket_regional_domain_name" {
  description = "The regional domain name of the documents bucket"
  value       = aws_s3_bucket.documents.bucket_regional_domain_name
}

output "backups_bucket_id" {
  description = "The name of the backups bucket"
  value       = aws_s3_bucket.backups.id
}

output "backups_bucket_arn" {
  description = "The ARN of the backups bucket"
  value       = aws_s3_bucket.backups.arn
}

output "backups_bucket_regional_domain_name" {
  description = "The regional domain name of the backups bucket"
  value       = aws_s3_bucket.backups.bucket_regional_domain_name
}

output "logs_bucket_id" {
  description = "The name of the logs bucket"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "The ARN of the logs bucket"
  value       = aws_s3_bucket.logs.arn
}

output "logs_bucket_regional_domain_name" {
  description = "The regional domain name of the logs bucket"
  value       = aws_s3_bucket.logs.bucket_regional_domain_name
}

output "all_bucket_arns" {
  description = "List of all bucket ARNs"
  value = [
    aws_s3_bucket.documents.arn,
    aws_s3_bucket.backups.arn,
    aws_s3_bucket.logs.arn
  ]
}
