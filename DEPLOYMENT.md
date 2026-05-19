# ECS Deployment Guide

This guide explains how to deploy the Engage application to AWS ECS using EC2 instances.

> **For detailed AWS hosting instructions, see [AWS_HOSTING_GUIDE.md](./AWS_HOSTING_GUIDE.md)**

## Prerequisites

1. **AWS CLI** installed and configured with appropriate credentials
2. **Docker** installed locally
3. **Jenkins** server with AWS credentials configured
4. **AWS Resources**:
   - VPC with public/private subnets
   - Security groups configured
   - EC2 instances (for ECS cluster)
   - Optional: Application Load Balancer

## Architecture Overview

- **ECS Cluster**: Container orchestration
- **EC2 Instances**: Host containers
- **ECR**: Docker image repository
- **Task Definition**: Container configuration
- **ECS Service**: Manages running containers
- **CloudWatch**: Logging and monitoring

## Setup Steps

### 1. Initial Infrastructure Setup

#### 1.1 Create IAM Roles

```bash
chmod +x scripts/setup-iam-roles.sh
./scripts/setup-iam-roles.sh
```

This creates:
- `ecsTaskExecutionRole`: For pulling images from ECR and writing logs
- `ecsTaskRole`: For application-specific permissions

#### 1.2 Create ECS Resources

```bash
chmod +x scripts/create-ecs-resources.sh

# Set your VPC configuration
export VPC_ID="vpc-xxxxxxxxx"
export SUBNET_IDS="subnet-xxxxx,subnet-yyyyy"
export SECURITY_GROUP_ID="sg-xxxxxxxxx"

# Optional: Load balancer configuration
export LOAD_BALANCER_ARN="arn:aws:elasticloadbalancing:..."
export TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:..."

./scripts/create-ecs-resources.sh
```

This creates:
- ECR repository
- CloudWatch log group
- ECS cluster
- Task definition
- ECS service (if VPC info provided)

#### 1.3 Set Up Secrets Manager

Store sensitive environment variables in AWS Secrets Manager:

```bash
# Database credentials
aws secretsmanager create-secret \
    --name engage/db/user \
    --secret-string "postgres" \
    --region us-east-1

aws secretsmanager create-secret \
    --name engage/db/password \
    --secret-string "your-password" \
    --region us-east-1

aws secretsmanager create-secret \
    --name engage/db/host \
    --secret-string "your-db-host" \
    --region us-east-1

aws secretsmanager create-secret \
    --name engage/db/name \
    --secret-string "engage" \
    --region us-east-1

aws secretsmanager create-secret \
    --name engage/db/port \
    --secret-string "5432" \
    --region us-east-1

# API URL
aws secretsmanager create-secret \
    --name engage/api/url \
    --secret-string "https://your-api-url.com" \
    --region us-east-1
```

### 2. Configure Jenkins

#### 2.1 Install Required Plugins

- AWS Steps Plugin
- Docker Pipeline Plugin
- Pipeline Plugin

#### 2.2 Configure AWS Credentials

1. Go to Jenkins → Manage Jenkins → Credentials
2. Add new credentials:
   - Kind: AWS Credentials
   - ID: `AWS_ACCOUNT_ID`
   - Access Key ID: Your AWS Access Key
   - Secret Access Key: Your AWS Secret Key

#### 2.3 Configure Jenkinsfile

Update the `Jenkinsfile` with your specific values:
- `AWS_REGION`
- `ECR_REPOSITORY`
- `ECS_CLUSTER`
- `ECS_SERVICE`
- `ECS_TASK_DEFINITION`

### 3. Manual Deployment

If you need to deploy manually:

```bash
chmod +x scripts/deploy-ecs.sh

# Set environment variables
export AWS_REGION="us-east-1"
export IMAGE_TAG="v1.0.0"

./scripts/deploy-ecs.sh
```

### 4. CI/CD Pipeline

The Jenkins pipeline automatically:
1. Checks out code
2. Installs dependencies
3. Runs linting
4. Builds the application
5. Builds Docker image
6. Pushes to ECR
7. Updates ECS task definition
8. Deploys to ECS service

To trigger:
- Push to your repository
- Jenkins will automatically build and deploy

## Configuration Files

### Task Definition

The `ecs-task-definition.json` file defines:
- Container image
- CPU and memory limits
- Environment variables
- Secrets from Secrets Manager
- Logging configuration
- Health checks

**Important**: Update the ARNs in `ecs-task-definition.json` with your actual AWS account ID and region.

### Environment Variables

The application requires:
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host
- `DB_NAME`: Database name
- `DB_PORT`: Database port (default: 5432)
- `NEXT_PUBLIC_API_URL`: Public API URL

These are stored in AWS Secrets Manager and referenced in the task definition.

## Monitoring

### CloudWatch Logs

Logs are automatically sent to CloudWatch:
- Log Group: `/ecs/engage-app`
- View logs in AWS Console or CLI

### Health Checks

The task definition includes a health check that hits `/api/health` endpoint.

## Scaling

### Manual Scaling

```bash
aws ecs update-service \
    --cluster engage-cluster \
    --service engage-service \
    --desired-count 4 \
    --region us-east-1
```

### Auto Scaling

Set up ECS Service Auto Scaling:
1. Go to ECS Console → Clusters → Services
2. Select your service
3. Go to "Auto Scaling" tab
4. Configure target tracking or step scaling

## Troubleshooting

### Container fails to start

1. Check CloudWatch logs
2. Verify task definition has correct image
3. Check IAM roles have correct permissions
4. Verify secrets are accessible

### Image pull errors

1. Verify ECR repository exists
2. Check IAM role has ECR permissions
3. Verify image tag exists in ECR

### Service not updating

1. Check service events in ECS Console
2. Verify task definition revision
3. Check for deployment constraints

## Local Development

Use Docker Compose for local development:

```bash
docker-compose up -d
```

This starts:
- Application on port 3000
- PostgreSQL database on port 5432

## Security Best Practices

1. **Secrets**: Always use AWS Secrets Manager, never hardcode
2. **IAM Roles**: Use least privilege principle
3. **Network**: Use private subnets for containers, public subnets only for load balancer
4. **Images**: Enable ECR image scanning
5. **Logs**: Enable CloudWatch log encryption

## Cost Optimization

1. Use appropriate instance types for your workload
2. Enable auto-scaling to scale down during low traffic
3. Use Spot instances for non-critical workloads
4. Monitor CloudWatch metrics and adjust resources

## Additional Resources

- [ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)

