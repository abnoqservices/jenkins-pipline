# AWS Hosting Guide

Complete guide to host the Engage application on AWS using ECS with EC2 instances.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [VPC and Networking](#vpc-and-networking)
4. [Database Setup (RDS)](#database-setup-rds)
5. [ECR Repository Setup](#ecr-repository-setup)
6. [ECS Cluster Setup](#ecs-cluster-setup)
7. [IAM Roles and Permissions](#iam-roles-and-permissions)
8. [Secrets Manager Configuration](#secrets-manager-configuration)
9. [Load Balancer Setup](#load-balancer-setup)
10. [EC2 Instances for ECS](#ec2-instances-for-ecs)
11. [Deployment](#deployment)
12. [Post-Deployment Configuration](#post-deployment-configuration)
13. [Monitoring and Logging](#monitoring-and-logging)
14. [Scaling and Optimization](#scaling-and-optimization)
15. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- AWS account with appropriate permissions
- AWS CLI installed and configured (`aws configure`)
- Docker installed locally
- Basic understanding of AWS services (VPC, ECS, RDS, IAM)
- Domain name (optional, for custom domain)

---

## AWS Account Setup

### 1. Create AWS Account

If you don't have an AWS account:
1. Go to [AWS Sign Up](https://aws.amazon.com/)
2. Complete registration
3. Set up billing alerts

### 2. Configure AWS CLI

```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (`json`)

### 3. Set Default Region

```bash
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1
```

---

## VPC and Networking

### 1. Create VPC

**Option A: Use Existing VPC**
- Note your VPC ID, Subnet IDs, and Security Group IDs

**Option B: Create New VPC**

```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --query 'Vpc.VpcId' \
  --output text)

# Name the VPC
aws ec2 create-tags \
  --resources $VPC_ID \
  --tags Key=Name,Value=engage-vpc

echo "VPC ID: $VPC_ID"
```

### 2. Create Internet Gateway

```bash
# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)

# Attach to VPC
aws ec2 attach-internet-gateway \
  --internet-gateway-id $IGW_ID \
  --vpc-id $VPC_ID

echo "Internet Gateway ID: $IGW_ID"
```

### 3. Create Subnets

```bash
# Get availability zones
AZ1=$(aws ec2 describe-availability-zones \
  --query 'AvailabilityZones[0].ZoneName' \
  --output text)
AZ2=$(aws ec2 describe-availability-zones \
  --query 'AvailabilityZones[1].ZoneName' \
  --output text)

# Create public subnet 1
PUBLIC_SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone $AZ1 \
  --query 'Subnet.SubnetId' \
  --output text)

# Create public subnet 2
PUBLIC_SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone $AZ2 \
  --query 'Subnet.SubnetId' \
  --output text)

# Create private subnet 1 (for RDS)
PRIVATE_SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.3.0/24 \
  --availability-zone $AZ1 \
  --query 'Subnet.SubnetId' \
  --output text)

# Create private subnet 2 (for RDS)
PRIVATE_SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.4.0/24 \
  --availability-zone $AZ2 \
  --query 'Subnet.SubnetId' \
  --output text)

echo "Public Subnet 1: $PUBLIC_SUBNET_1"
echo "Public Subnet 2: $PUBLIC_SUBNET_2"
echo "Private Subnet 1: $PRIVATE_SUBNET_1"
echo "Private Subnet 2: $PRIVATE_SUBNET_2"
```

### 4. Create Route Table

```bash
# Create route table
ROUTE_TABLE_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --query 'RouteTable.RouteTableId' \
  --output text)

# Add route to internet gateway
aws ec2 create-route \
  --route-table-id $ROUTE_TABLE_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID

# Associate subnets with route table
aws ec2 associate-route-table \
  --subnet-id $PUBLIC_SUBNET_1 \
  --route-table-id $ROUTE_TABLE_ID

aws ec2 associate-route-table \
  --subnet-id $PUBLIC_SUBNET_2 \
  --route-table-id $ROUTE_TABLE_ID
```

### 5. Create Security Groups

```bash
# Security group for ECS tasks
ECS_SG_ID=$(aws ec2 create-security-group \
  --group-name engage-ecs-sg \
  --description "Security group for ECS tasks" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow HTTP from load balancer (we'll update this after creating ALB)
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 3000 \
  --source-group $ECS_SG_ID

# Security group for RDS
RDS_SG_ID=$(aws ec2 create-security-group \
  --group-name engage-rds-sg \
  --description "Security group for RDS database" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow PostgreSQL from ECS security group
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $ECS_SG_ID

# Security group for Load Balancer
ALB_SG_ID=$(aws ec2 create-security-group \
  --group-name engage-alb-sg \
  --description "Security group for Application Load Balancer" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow HTTP and HTTPS from internet
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

echo "ECS Security Group: $ECS_SG_ID"
echo "RDS Security Group: $RDS_SG_ID"
echo "ALB Security Group: $ALB_SG_ID"
```

**Save these values for later use:**
```bash
export VPC_ID="vpc-xxxxx"
export PUBLIC_SUBNET_1="subnet-xxxxx"
export PUBLIC_SUBNET_2="subnet-yyyyy"
export ECS_SG_ID="sg-xxxxx"
export RDS_SG_ID="sg-yyyyy"
export ALB_SG_ID="sg-zzzzz"
```

---

## Database Setup (RDS)

### 1. Create DB Subnet Group

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name engage-db-subnet-group \
  --db-subnet-group-description "Subnet group for Engage database" \
  --subnet-ids $PRIVATE_SUBNET_1 $PRIVATE_SUBNET_2
```

### 2. Create RDS Instance

```bash
# Generate a secure password
DB_PASSWORD=$(openssl rand -base64 32)

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier engage-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password $DB_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp2 \
  --db-name engage \
  --vpc-security-group-ids $RDS_SG_ID \
  --db-subnet-group-name engage-db-subnet-group \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false \
  --storage-encrypted

echo "Database password: $DB_PASSWORD"
echo "Save this password securely!"
```

### 3. Get Database Endpoint

Wait for the database to be available (takes 5-10 minutes), then:

```bash
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier engage-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "Database Endpoint: $DB_ENDPOINT"
```

---

## ECR Repository Setup

### 1. Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name engage-app \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  --region $AWS_REGION
```

### 2. Get ECR Repository URI

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/engage-app"

echo "ECR Repository URI: $ECR_URI"
```

---

## ECS Cluster Setup

### 1. Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name engage-cluster \
  --capacity-providers EC2 \
  --default-capacity-provider-strategy capacityProvider=EC2,weight=1 \
  --region $AWS_REGION
```

### 2. Create CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/engage-app \
  --region $AWS_REGION
```

---

## IAM Roles and Permissions

### 1. Create Task Execution Role

```bash
# Create trust policy
cat > /tmp/ecs-task-execution-trust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file:///tmp/ecs-task-execution-trust.json

# Attach managed policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create custom policy for Secrets Manager
cat > /tmp/secrets-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:engage/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name SecretsManagerAccess \
  --policy-document file:///tmp/secrets-policy.json
```

### 2. Create Task Role

```bash
# Create trust policy
cat > /tmp/ecs-task-trust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document file:///tmp/ecs-task-trust.json

# Create policy for S3 access (if needed for file uploads)
cat > /tmp/s3-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::engage-uploads/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name ecsTaskRole \
  --policy-name S3Access \
  --policy-document file:///tmp/s3-policy.json
```

### 3. Create EC2 Instance Role for ECS

```bash
# Create instance profile
aws iam create-role \
  --role-name ecsInstanceRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach managed policy
aws iam attach-role-policy \
  --role-name ecsInstanceRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name ecsInstanceProfile

aws iam add-role-to-instance-profile \
  --instance-profile-name ecsInstanceProfile \
  --role-name ecsInstanceRole
```

---

## Secrets Manager Configuration

### 1. Store Database Credentials

```bash
# Store database user
aws secretsmanager create-secret \
  --name engage/db/user \
  --secret-string "postgres" \
  --region $AWS_REGION

# Store database password
aws secretsmanager create-secret \
  --name engage/db/password \
  --secret-string "$DB_PASSWORD" \
  --region $AWS_REGION

# Store database host
aws secretsmanager create-secret \
  --name engage/db/host \
  --secret-string "$DB_ENDPOINT" \
  --region $AWS_REGION

# Store database name
aws secretsmanager create-secret \
  --name engage/db/name \
  --secret-string "engage" \
  --region $AWS_REGION

# Store database port
aws secretsmanager create-secret \
  --name engage/db/port \
  --secret-string "5432" \
  --region $AWS_REGION
```

### 2. Store API URL

```bash
# Update this with your actual API URL after deployment
aws secretsmanager create-secret \
  --name engage/api/url \
  --secret-string "https://your-domain.com" \
  --region $AWS_REGION
```

### 3. Get Secret ARNs

```bash
# Get secret ARNs for task definition
for secret in user password host name port; do
  ARN=$(aws secretsmanager describe-secret \
    --secret-id engage/db/$secret \
    --query 'ARN' \
    --output text)
  echo "engage/db/$secret: $ARN"
done
```

---

## Load Balancer Setup

### 1. Create Application Load Balancer

```bash
# Get subnet IDs
SUBNET_IDS="$PUBLIC_SUBNET_1,$PUBLIC_SUBNET_2"

# Create load balancer
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name engage-alb \
  --subnets $PUBLIC_SUBNET_1 $PUBLIC_SUBNET_2 \
  --security-groups $ALB_SG_ID \
  --scheme internet-facing \
  --type application \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

echo "Load Balancer ARN: $ALB_ARN"

# Get DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "Load Balancer DNS: $ALB_DNS"
```

### 2. Create Target Group

```bash
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
  --name engage-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

echo "Target Group ARN: $TARGET_GROUP_ARN"
```

### 3. Create Listener

```bash
# HTTP listener (redirects to HTTPS if you have SSL)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN

# HTTPS listener (if you have SSL certificate)
# aws elbv2 create-listener \
#   --load-balancer-arn $ALB_ARN \
#   --protocol HTTPS \
#   --port 443 \
#   --certificates CertificateArn=arn:aws:acm:... \
#   --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN
```

### 4. Update ECS Security Group

```bash
# Allow traffic from ALB to ECS
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 3000 \
  --source-group $ALB_SG_ID
```

---

## EC2 Instances for ECS

### 1. Create Launch Template

```bash
# Get the ECS-optimized AMI
ECS_AMI=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=amzn2-ami-ecs-hvm-*-x86_64-ebs" \
  --query 'Images[0].ImageId' \
  --output text)

# Get instance profile ARN
INSTANCE_PROFILE_ARN=$(aws iam get-instance-profile \
  --instance-profile-name ecsInstanceProfile \
  --query 'InstanceProfile.Arn' \
  --output text)

# Create launch template
cat > /tmp/user-data.sh <<EOF
#!/bin/bash
echo ECS_CLUSTER=engage-cluster >> /etc/ecs/ecs.config
EOF

aws ec2 create-launch-template \
  --launch-template-name engage-ecs-launch-template \
  --launch-template-data "{
    \"ImageId\": \"$ECS_AMI\",
    \"InstanceType\": \"t3.medium\",
    \"IamInstanceProfile\": {
      \"Arn\": \"$INSTANCE_PROFILE_ARN\"
    },
    \"SecurityGroupIds\": [\"$ECS_SG_ID\"],
    \"UserData\": \"$(base64 -w 0 /tmp/user-data.sh)\",
    \"TagSpecifications\": [{
      \"ResourceType\": \"instance\",
      \"Tags\": [{\"Key\": \"Name\", \"Value\": \"engage-ecs-instance\"}]
    }]
  }"
```

### 2. Create Auto Scaling Group

```bash
# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name engage-ecs-asg \
  --launch-template LaunchTemplateName=engage-ecs-launch-template,Version='$Latest' \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 2 \
  --vpc-zone-identifier "$PUBLIC_SUBNET_1,$PUBLIC_SUBNET_2" \
  --health-check-type ELB \
  --health-check-grace-period 300
```

---

## Deployment

### 1. Update Task Definition

Update `ecs-task-definition.json` with:
- Your AWS Account ID
- Your region
- Secret ARNs from Secrets Manager
- Load balancer target group ARN (if using)

### 2. Register Task Definition

```bash
# Replace placeholders in task definition
sed "s/YOUR_ACCOUNT_ID/${AWS_ACCOUNT_ID}/g; s/us-east-1/${AWS_REGION}/g" \
  ecs-task-definition.json > task-definition-temp.json

aws ecs register-task-definition \
  --cli-input-json file://task-definition-temp.json \
  --region $AWS_REGION
```

### 3. Build and Push Docker Image

```bash
# Build image
docker build -t engage-app:latest .

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_URI

# Tag and push
docker tag engage-app:latest $ECR_URI:latest
docker push $ECR_URI:latest
```

### 4. Create ECS Service

```bash
aws ecs create-service \
  --cluster engage-cluster \
  --service-name engage-service \
  --task-definition engage-task-def \
  --desired-count 2 \
  --launch-type EC2 \
  --load-balancers targetGroupArn=$TARGET_GROUP_ARN,containerName=engage-app,containerPort=3000 \
  --network-configuration "awsvpcConfiguration={subnets=[$PUBLIC_SUBNET_1,$PUBLIC_SUBNET_2],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
  --region $AWS_REGION
```

### 5. Verify Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster engage-cluster \
  --services engage-service \
  --region $AWS_REGION

# Check running tasks
aws ecs list-tasks \
  --cluster engage-cluster \
  --service-name engage-service \
  --region $AWS_REGION
```

---

## Post-Deployment Configuration

### 1. Update API URL

After deployment, update the API URL secret:

```bash
aws secretsmanager update-secret \
  --secret-id engage/api/url \
  --secret-string "http://$ALB_DNS" \
  --region $AWS_REGION
```

### 2. Configure Custom Domain (Optional)

1. Create Route 53 hosted zone (if using Route 53)
2. Create A record pointing to load balancer
3. Request SSL certificate in ACM
4. Update load balancer listener to use HTTPS

### 3. Set Up S3 for File Uploads (Optional)

```bash
# Create S3 bucket
aws s3 mb s3://engage-uploads --region $AWS_REGION

# Configure bucket policy for public read (if needed)
# Update application to use S3 instead of local storage
```

---

## Monitoring and Logging

### 1. CloudWatch Dashboards

Create a dashboard to monitor:
- ECS service metrics
- Application logs
- Database performance
- Load balancer metrics

### 2. Set Up Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name engage-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### 3. View Logs

```bash
# View application logs
aws logs tail /ecs/engage-app --follow --region $AWS_REGION
```

---

## Scaling and Optimization

### 1. Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/engage-cluster/engage-service \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/engage-cluster/engage-service \
  --policy-name engage-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 300
  }'
```

### 2. Cost Optimization

- Use Spot instances for non-critical workloads
- Right-size EC2 instances based on metrics
- Enable RDS automated backups
- Use CloudWatch Insights for log analysis

---

## Troubleshooting

### Common Issues

#### 1. Tasks Not Starting

```bash
# Check task status
aws ecs describe-tasks \
  --cluster engage-cluster \
  --tasks <task-id> \
  --region $AWS_REGION

# Check CloudWatch logs
aws logs tail /ecs/engage-app --follow
```

#### 2. Cannot Connect to Database

- Verify security groups allow traffic
- Check database endpoint
- Verify secrets are correct
- Check RDS instance is in same VPC

#### 3. Load Balancer Health Checks Failing

- Verify `/api/health` endpoint exists
- Check security group rules
- Verify tasks are running
- Check target group health

#### 4. Image Pull Errors

```bash
# Verify ECR permissions
aws ecr describe-repositories --repository-names engage-app

# Check IAM role has ECR permissions
aws iam get-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name SecretsManagerAccess
```

---

## Cleanup

To remove all resources:

```bash
# Delete ECS service
aws ecs update-service \
  --cluster engage-cluster \
  --service engage-service \
  --desired-count 0

aws ecs delete-service \
  --cluster engage-cluster \
  --service engage-service

# Delete load balancer
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN

# Delete RDS instance
aws rds delete-db-instance \
  --db-instance-identifier engage-db \
  --skip-final-snapshot

# Delete ECR repository
aws ecr delete-repository \
  --repository-name engage-app \
  --force

# Delete CloudFormation stack (if used)
aws cloudformation delete-stack --stack-name engage-ecs-infrastructure
```

---

## Next Steps

1. Set up CI/CD pipeline with Jenkins (see `JENKINS_SETUP.md`)
2. Configure custom domain and SSL certificate
3. Set up monitoring and alerting
4. Implement backup strategies
5. Configure auto-scaling policies
6. Set up disaster recovery plan

---

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

---

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review ECS service events
3. Verify IAM permissions
4. Check security group rules
5. Review this guide's troubleshooting section


