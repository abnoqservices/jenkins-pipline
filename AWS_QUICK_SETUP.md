# AWS Quick Setup Script

This script automates the AWS infrastructure setup. Run it step by step or use it as a reference.

## Prerequisites

```bash
# Ensure AWS CLI is configured
aws configure

# Set your region
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

## Complete Setup Script

Save this as `setup-aws-infrastructure.sh`:

```bash
#!/bin/bash
set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🚀 Starting AWS Infrastructure Setup"
echo "Region: $AWS_REGION"
echo "Account ID: $AWS_ACCOUNT_ID"

# Step 1: Create VPC
echo "📦 Creating VPC..."
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=engage-vpc
echo "✅ VPC Created: $VPC_ID"

# Step 2: Create Internet Gateway
echo "🌐 Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID
echo "✅ Internet Gateway: $IGW_ID"

# Step 3: Create Subnets
echo "📡 Creating Subnets..."
AZ1=$(aws ec2 describe-availability-zones --query 'AvailabilityZones[0].ZoneName' --output text)
AZ2=$(aws ec2 describe-availability-zones --query 'AvailabilityZones[1].ZoneName' --output text)

PUBLIC_SUBNET_1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone $AZ1 --query 'Subnet.SubnetId' --output text)
PUBLIC_SUBNET_2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone $AZ2 --query 'Subnet.SubnetId' --output text)
PRIVATE_SUBNET_1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.3.0/24 --availability-zone $AZ1 --query 'Subnet.SubnetId' --output text)
PRIVATE_SUBNET_2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.4.0/24 --availability-zone $AZ2 --query 'Subnet.SubnetId' --output text)
echo "✅ Subnets Created"

# Step 4: Create Route Table
echo "🛣️  Creating Route Table..."
ROUTE_TABLE_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $ROUTE_TABLE_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_1 --route-table-id $ROUTE_TABLE_ID
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_2 --route-table-id $ROUTE_TABLE_ID
echo "✅ Route Table Created"

# Step 5: Create Security Groups
echo "🔒 Creating Security Groups..."
ECS_SG_ID=$(aws ec2 create-security-group --group-name engage-ecs-sg --description "ECS Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text)
RDS_SG_ID=$(aws ec2 create-security-group --group-name engage-rds-sg --description "RDS Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text)
ALB_SG_ID=$(aws ec2 create-security-group --group-name engage-alb-sg --description "ALB Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $RDS_SG_ID --protocol tcp --port 5432 --source-group $ECS_SG_ID
echo "✅ Security Groups Created"

# Step 6: Create RDS
echo "🗄️  Creating RDS Database..."
DB_PASSWORD=$(openssl rand -base64 32)
aws rds create-db-subnet-group --db-subnet-group-name engage-db-subnet-group --db-subnet-group-description "Engage DB Subnet" --subnet-ids $PRIVATE_SUBNET_1 $PRIVATE_SUBNET_2

aws rds create-db-instance \
  --db-instance-identifier engage-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password $DB_PASSWORD \
  --allocated-storage 20 \
  --db-name engage \
  --vpc-security-group-ids $RDS_SG_ID \
  --db-subnet-group-name engage-db-subnet-group \
  --backup-retention-period 7 \
  --publicly-accessible false

echo "⏳ Waiting for database to be available (this may take 10 minutes)..."
aws rds wait db-instance-available --db-instance-identifier engage-db
DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier engage-db --query 'DBInstances[0].Endpoint.Address' --output text)
echo "✅ Database Created: $DB_ENDPOINT"
echo "🔑 Database Password: $DB_PASSWORD (SAVE THIS!)"

# Step 7: Create ECR
echo "📦 Creating ECR Repository..."
aws ecr create-repository --repository-name engage-app --image-scanning-configuration scanOnPush=true --region $AWS_REGION 2>/dev/null || echo "ECR already exists"
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/engage-app"
echo "✅ ECR Repository: $ECR_URI"

# Step 8: Create ECS Cluster
echo "🚢 Creating ECS Cluster..."
aws ecs create-cluster --cluster-name engage-cluster --capacity-providers EC2 --default-capacity-provider-strategy capacityProvider=EC2,weight=1 --region $AWS_REGION 2>/dev/null || echo "Cluster already exists"
aws logs create-log-group --log-group-name /ecs/engage-app --region $AWS_REGION 2>/dev/null || echo "Log group already exists"
echo "✅ ECS Cluster Created"

# Step 9: Setup IAM Roles
echo "👤 Setting up IAM Roles..."
./scripts/setup-iam-roles.sh

# Step 10: Store Secrets
echo "🔐 Storing Secrets..."
aws secretsmanager create-secret --name engage/db/user --secret-string "postgres" --region $AWS_REGION 2>/dev/null || aws secretsmanager update-secret --secret-id engage/db/user --secret-string "postgres" --region $AWS_REGION
aws secretsmanager create-secret --name engage/db/password --secret-string "$DB_PASSWORD" --region $AWS_REGION 2>/dev/null || aws secretsmanager update-secret --secret-id engage/db/password --secret-string "$DB_PASSWORD" --region $AWS_REGION
aws secretsmanager create-secret --name engage/db/host --secret-string "$DB_ENDPOINT" --region $AWS_REGION 2>/dev/null || aws secretsmanager update-secret --secret-id engage/db/host --secret-string "$DB_ENDPOINT" --region $AWS_REGION
aws secretsmanager create-secret --name engage/db/name --secret-string "engage" --region $AWS_REGION 2>/dev/null || aws secretsmanager update-secret --secret-id engage/db/name --secret-string "engage" --region $AWS_REGION
aws secretsmanager create-secret --name engage/db/port --secret-string "5432" --region $AWS_REGION 2>/dev/null || aws secretsmanager update-secret --secret-id engage/db/port --secret-string "5432" --region $AWS_REGION
echo "✅ Secrets Stored"

# Step 11: Create Load Balancer
echo "⚖️  Creating Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer --name engage-alb --subnets $PUBLIC_SUBNET_1 $PUBLIC_SUBNET_2 --security-groups $ALB_SG_ID --scheme internet-facing --type application --query 'LoadBalancers[0].LoadBalancerArn' --output text)
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text)
echo "✅ Load Balancer: $ALB_DNS"

TARGET_GROUP_ARN=$(aws elbv2 create-target-group --name engage-targets --protocol HTTP --port 3000 --vpc-id $VPC_ID --health-check-path /api/health --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN
echo "✅ Target Group Created"

# Step 12: Update Security Groups
aws ec2 authorize-security-group-ingress --group-id $ECS_SG_ID --protocol tcp --port 3000 --source-group $ALB_SG_ID 2>/dev/null || echo "Rule already exists"

# Save configuration
cat > aws-config.env <<EOF
export AWS_REGION=$AWS_REGION
export AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
export VPC_ID=$VPC_ID
export PUBLIC_SUBNET_1=$PUBLIC_SUBNET_1
export PUBLIC_SUBNET_2=$PUBLIC_SUBNET_2
export PRIVATE_SUBNET_1=$PRIVATE_SUBNET_1
export PRIVATE_SUBNET_2=$PRIVATE_SUBNET_2
export ECS_SG_ID=$ECS_SG_ID
export RDS_SG_ID=$RDS_SG_ID
export ALB_SG_ID=$ALB_SG_ID
export DB_ENDPOINT=$DB_ENDPOINT
export DB_PASSWORD=$DB_PASSWORD
export ECR_URI=$ECR_URI
export ALB_DNS=$ALB_DNS
export TARGET_GROUP_ARN=$TARGET_GROUP_ARN
EOF

echo ""
echo "✅ Infrastructure Setup Complete!"
echo ""
echo "📋 Configuration saved to aws-config.env"
echo "🌐 Load Balancer DNS: $ALB_DNS"
echo ""
echo "Next steps:"
echo "1. Source the config: source aws-config.env"
echo "2. Create EC2 instances for ECS cluster"
echo "3. Deploy application: ./scripts/deploy-ecs.sh"
```

## Usage

```bash
chmod +x setup-aws-infrastructure.sh
./setup-aws-infrastructure.sh
```

## After Setup

```bash
# Source the configuration
source aws-config.env

# Update task definition with your values
sed -i.bak "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" ecs-task-definition.json
sed -i.bak "s/us-east-1/$AWS_REGION/g" ecs-task-definition.json

# Deploy the application
./scripts/deploy-ecs.sh
```


