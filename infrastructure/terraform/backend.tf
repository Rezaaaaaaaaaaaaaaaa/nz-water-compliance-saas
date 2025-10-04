# Terraform Backend Configuration
# Stores state in S3 with DynamoDB locking for team collaboration

terraform {
  backend "s3" {
    bucket         = "compliance-saas-terraform-state"  # Must be created manually first
    key            = "terraform.tfstate"
    region         = "ap-southeast-2"
    encrypt        = true
    dynamodb_table = "compliance-saas-terraform-locks"  # Must be created manually first

    # Recommended: Use role assumption for cross-account deployments
    # role_arn = "arn:aws:iam::ACCOUNT_ID:role/TerraformRole"
  }
}

# To initialize the backend:
# 1. Create S3 bucket manually:
#    aws s3api create-bucket \
#      --bucket compliance-saas-terraform-state \
#      --region ap-southeast-2 \
#      --create-bucket-configuration LocationConstraint=ap-southeast-2
#
#    aws s3api put-bucket-versioning \
#      --bucket compliance-saas-terraform-state \
#      --versioning-configuration Status=Enabled
#
#    aws s3api put-bucket-encryption \
#      --bucket compliance-saas-terraform-state \
#      --server-side-encryption-configuration \
#      '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
#
# 2. Create DynamoDB table manually:
#    aws dynamodb create-table \
#      --table-name compliance-saas-terraform-locks \
#      --attribute-definitions AttributeName=LockID,AttributeType=S \
#      --key-schema AttributeName=LockID,KeyType=HASH \
#      --billing-mode PAY_PER_REQUEST \
#      --region ap-southeast-2
#
# 3. Run terraform init to migrate state:
#    terraform init
