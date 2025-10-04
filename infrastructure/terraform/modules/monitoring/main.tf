# Monitoring Module for NZ Water Compliance SaaS
# Consolidated CloudWatch Logs, Dashboards, and SNS Alerts

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name              = "${var.project_name}-alerts"
  display_name      = "Compliance SaaS Alerts"
  kms_master_key_id = var.enable_encryption ? "alias/aws/sns" : null

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-alerts"
    }
  )
}

# SNS Topic Subscription (Email)
resource "aws_sns_topic_subscription" "email_alerts" {
  count     = length(var.alert_email_addresses)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_addresses[count.index]
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name              = "/aws/elasticache/${var.project_name}/redis/slow-log"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-redis-slow-log"
    }
  )
}

resource "aws_cloudwatch_log_group" "redis_engine_log" {
  name              = "/aws/elasticache/${var.project_name}/redis/engine-log"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-redis-engine-log"
    }
  )
}

resource "aws_cloudwatch_log_group" "workers" {
  name              = "/ecs/${var.project_name}/workers"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-workers-logs"
    }
  )
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # ECS Metrics
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average", label = "CPU Utilization" }],
            [".", "MemoryUtilization", { stat = "Average", label = "Memory Utilization" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS Performance"
          period  = 300
        }
      },
      # RDS Metrics
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "CPU Utilization" }],
            [".", "DatabaseConnections", { stat = "Average", label = "Connections" }],
            [".", "FreeStorageSpace", { stat = "Average", label = "Free Storage" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS Performance"
          period  = 300
        }
      },
      # ElastiCache Metrics
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", { stat = "Average", label = "CPU" }],
            [".", "DatabaseMemoryUsagePercentage", { stat = "Average", label = "Memory %" }],
            [".", "CurrConnections", { stat = "Average", label = "Connections" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Redis Performance"
          period  = 300
        }
      },
      # ALB Metrics
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", label = "Response Time" }],
            [".", "RequestCount", { stat = "Sum", label = "Requests" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum", label = "5XX Errors" }],
            [".", "HTTPCode_Target_4XX_Count", { stat = "Sum", label = "4XX Errors" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ALB Performance"
          period  = 300
        }
      },
      # Target Health
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HealthyHostCount", { stat = "Average", label = "Healthy" }],
            [".", "UnHealthyHostCount", { stat = "Average", label = "Unhealthy" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Target Health"
          period  = 60
        }
      },
      # Application Logs (Recent Errors)
      {
        type = "log"
        properties = {
          query   = "SOURCE '${var.backend_log_group_name}'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20"
          region  = var.aws_region
          title   = "Recent Errors (Last 20)"
        }
      }
    ]
  })
}

# Composite Alarm - System Health
resource "aws_cloudwatch_composite_alarm" "system_health" {
  alarm_name          = "${var.project_name}-system-health"
  alarm_description   = "Overall system health composite alarm"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  alarm_rule = "ALARM(${var.project_name}-ecs-cpu-utilization-high) OR ALARM(${var.project_name}-rds-cpu-utilization) OR ALARM(${var.project_name}-redis-cpu-utilization) OR ALARM(${var.project_name}-alb-5xx-errors)"

  depends_on = [aws_sns_topic.alerts]

  tags = var.tags
}

# CloudWatch Log Metric Filter - Application Errors
resource "aws_cloudwatch_log_metric_filter" "app_errors" {
  name           = "${var.project_name}-app-errors"
  log_group_name = var.backend_log_group_name
  pattern        = "[time, request_id, level = ERROR, ...]"

  metric_transformation {
    name      = "ApplicationErrors"
    namespace = var.project_name
    value     = "1"
    unit      = "Count"
  }
}

# Alarm for Application Errors
resource "aws_cloudwatch_metric_alarm" "app_errors" {
  alarm_name          = "${var.project_name}-application-errors"
  alarm_description   = "Application error rate is high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApplicationErrors"
  namespace           = var.project_name
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = var.tags

  depends_on = [aws_cloudwatch_log_metric_filter.app_errors]
}

# CloudWatch Insights Query - Saved Queries
resource "aws_cloudwatch_query_definition" "error_analysis" {
  name = "${var.project_name}/error-analysis"

  log_group_names = [var.backend_log_group_name]

  query_string = <<-QUERY
    fields @timestamp, @message, level, err.message as error_message
    | filter level = "ERROR"
    | stats count() by error_message
    | sort count desc
    | limit 20
  QUERY
}

resource "aws_cloudwatch_query_definition" "slow_requests" {
  name = "${var.project_name}/slow-requests"

  log_group_names = [var.backend_log_group_name]

  query_string = <<-QUERY
    fields @timestamp, url, method, responseTime
    | filter responseTime > 1000
    | sort responseTime desc
    | limit 50
  QUERY
}

resource "aws_cloudwatch_query_definition" "user_activity" {
  name = "${var.project_name}/user-activity"

  log_group_names = [var.backend_log_group_name]

  query_string = <<-QUERY
    fields @timestamp, userId, action, resource
    | filter userId != ""
    | stats count() by userId
    | sort count desc
    | limit 20
  QUERY
}
