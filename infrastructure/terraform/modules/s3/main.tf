# S3 Buckets Module for NZ Water Compliance SaaS

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Documents Bucket
resource "aws_s3_bucket" "documents" {
  bucket = "${var.project_name}-documents-${var.environment}"

  tags = merge(
    var.tags,
    {
      Name        = "${var.project_name}-documents"
      Purpose     = "Document storage for compliance system"
      Compliance  = "7-year retention"
    }
  )
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  # Transition to Glacier for cost savings after 1 year
  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    # 7-year retention for regulatory compliance
    expiration {
      days = 2555 # 7 years
    }
  }

  # Clean up incomplete multipart uploads
  rule {
    id     = "cleanup-multipart"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Backups Bucket
resource "aws_s3_bucket" "backups" {
  bucket = "${var.project_name}-backups-${var.environment}"

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-backups"
      Purpose = "Database and system backups"
    }
  )
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "retention-policy"
    status = "Enabled"

    # Move to Infrequent Access after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Move to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Delete after 7 years
    expiration {
      days = 2555
    }
  }
}

# Logs Bucket
resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-logs-${var.environment}"

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-logs"
      Purpose = "Application and access logs"
    }
  )
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    # Move to Infrequent Access after 90 days
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    # Move to Glacier after 180 days
    transition {
      days          = 180
      storage_class = "GLACIER"
    }

    # Delete after 7 years (compliance requirement)
    expiration {
      days = 2555
    }
  }
}

# Bucket Policy for ALB Logs (if needed)
resource "aws_s3_bucket_policy" "logs" {
  count  = var.enable_alb_logging ? 1 : 0
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "elasticloadbalancing.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/*"
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "elasticloadbalancing.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs.arn
      }
    ]
  })
}

# S3 Bucket Metrics
resource "aws_s3_bucket_metric" "documents" {
  bucket = aws_s3_bucket.documents.id
  name   = "EntireBucket"
}

resource "aws_s3_bucket_metric" "backups" {
  bucket = aws_s3_bucket.backups.id
  name   = "EntireBucket"
}

resource "aws_s3_bucket_metric" "logs" {
  bucket = aws_s3_bucket.logs.id
  name   = "EntireBucket"
}

# CloudWatch Alarms for S3 Storage
resource "aws_cloudwatch_metric_alarm" "documents_storage" {
  alarm_name          = "${var.project_name}-s3-documents-storage"
  alarm_description   = "Documents bucket storage size"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BucketSizeBytes"
  namespace           = "AWS/S3"
  period              = "86400" # 1 day
  statistic           = "Average"
  threshold           = var.storage_alarm_threshold_gb * 1073741824 # Convert GB to bytes

  dimensions = {
    BucketName  = aws_s3_bucket.documents.id
    StorageType = "StandardStorage"
  }

  alarm_actions = var.alarm_actions

  tags = var.tags
}
