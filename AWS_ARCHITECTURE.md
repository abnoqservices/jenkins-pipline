# AWS Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet Users                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Application Load Balancer (ALB)                     │
│              - HTTP/HTTPS (Port 80/443)                          │
│              - Health Checks                                     │
│              - SSL Termination (Optional)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Target Group                                 │
│                    - Port 3000                                  │
│                    - Health Check: /api/health                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ECS Service                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Task 1     │  │   Task 2     │  │   Task N     │        │
│  │  Container   │  │  Container   │  │  Container   │        │
│  │  Port 3000   │  │  Port 3000   │  │  Port 3000   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    ECS Cluster                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  EC2 Instance│  │  EC2 Instance│  │  EC2 Instance│        │
│  │  (t3.medium) │  │  (t3.medium) │  │  (t3.medium) │        │
│  │  ECS Agent   │  │  ECS Agent   │  │  ECS Agent   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    VPC (10.0.0.0/16)                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Public Subnets (10.0.1.0/24, 10.0.2.0/24)              │  │
│  │  - ALB                                                    │  │
│  │  - EC2 Instances (ECS)                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Private Subnets (10.0.3.0/24, 10.0.4.0/24)              │  │
│  │  - RDS PostgreSQL Database                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Application Load Balancer (ALB)
- **Purpose**: Distributes incoming traffic across multiple ECS tasks
- **Type**: Application Load Balancer
- **Ports**: 80 (HTTP), 443 (HTTPS - optional)
- **Health Checks**: Monitors `/api/health` endpoint
- **Location**: Public subnets

### 2. ECS Service
- **Type**: EC2 launch type
- **Tasks**: Multiple container instances
- **Scaling**: Auto-scaling based on CPU/memory
- **Health Checks**: Container-level health monitoring

### 3. ECS Cluster
- **Capacity Provider**: EC2
- **Instances**: Auto Scaling Group with EC2 instances
- **Instance Type**: t3.medium (configurable)
- **Min/Max**: 2-10 instances (configurable)

### 4. ECS Tasks
- **Container**: Docker container from ECR
- **Port**: 3000
- **Resources**: 512 CPU units, 1024 MB memory
- **Network**: awsvpc mode

### 5. RDS Database
- **Engine**: PostgreSQL 15.4
- **Instance**: db.t3.micro (configurable)
- **Storage**: 20 GB gp2
- **Backup**: 7-day retention
- **Location**: Private subnets
- **Multi-AZ**: Optional for high availability

### 6. ECR Repository
- **Purpose**: Stores Docker images
- **Scanning**: Enabled on push
- **Encryption**: AES256

### 7. Secrets Manager
- **Purpose**: Stores sensitive configuration
- **Secrets**:
  - Database credentials
  - API URLs
  - Other environment variables

### 8. CloudWatch
- **Logs**: Application logs from ECS tasks
- **Metrics**: ECS, RDS, ALB metrics
- **Alarms**: CPU, memory, error rate monitoring

## Network Flow

1. **User Request** → Internet
2. **DNS Resolution** → Route 53 (if using custom domain)
3. **Load Balancer** → ALB receives request
4. **Target Group** → Routes to healthy ECS task
5. **ECS Task** → Container processes request
6. **Database Query** → RDS (if needed)
7. **Response** → Back through the chain

## Security Layers

### 1. Network Security
- **VPC**: Isolated network environment
- **Security Groups**: Firewall rules
- **NACLs**: Subnet-level access control
- **Private Subnets**: Database isolation

### 2. Application Security
- **IAM Roles**: Least privilege access
- **Secrets Manager**: Encrypted secrets
- **SSL/TLS**: HTTPS encryption (optional)
- **Image Scanning**: ECR vulnerability scanning

### 3. Data Security
- **Encryption at Rest**: RDS encryption
- **Encryption in Transit**: TLS/SSL
- **Backups**: Automated RDS backups

## Scaling Strategy

### Horizontal Scaling
- **ECS Service**: Auto-scales tasks based on CPU/memory
- **EC2 Instances**: Auto Scaling Group scales instances
- **Load Balancer**: Distributes load automatically

### Vertical Scaling
- **EC2 Instances**: Change instance type
- **RDS**: Modify instance class
- **Task Resources**: Adjust CPU/memory allocation

## High Availability

### Multi-AZ Deployment
- **RDS**: Multi-AZ for database redundancy
- **Subnets**: Multiple availability zones
- **ECS Tasks**: Distributed across AZs
- **ALB**: Cross-AZ load balancing

### Backup and Recovery
- **RDS**: Automated daily backups
- **ECR**: Image versioning
- **CloudWatch**: Log retention
- **Task Definitions**: Versioned revisions

## Cost Optimization

### Resource Sizing
- Start with smaller instances (t3.micro, db.t3.micro)
- Monitor and scale based on actual usage
- Use Reserved Instances for predictable workloads

### Auto Scaling
- Scale down during low-traffic periods
- Use Spot Instances for non-critical workloads
- Implement scheduled scaling

### Storage
- Use gp2 for RDS (cost-effective)
- Enable ECR lifecycle policies
- Archive old CloudWatch logs

## Monitoring Points

1. **ALB Metrics**: Request count, latency, error rates
2. **ECS Metrics**: CPU, memory, task count
3. **RDS Metrics**: CPU, connections, storage
4. **Application Logs**: CloudWatch Logs
5. **Health Checks**: ALB and ECS health status

## Disaster Recovery

### Backup Strategy
- **RDS Snapshots**: Automated daily + manual
- **Task Definitions**: Versioned in ECS
- **Application Code**: Git repository
- **Configuration**: Infrastructure as Code (CloudFormation)

### Recovery Procedures
1. Restore RDS from snapshot
2. Redeploy application from ECR
3. Update task definition
4. Verify service health

## Best Practices

1. **Use Private Subnets**: For databases and internal services
2. **Enable Encryption**: At rest and in transit
3. **Implement Logging**: Comprehensive CloudWatch logging
4. **Set Up Alarms**: Proactive monitoring
5. **Regular Backups**: Automated and tested
6. **Security Groups**: Least privilege principle
7. **IAM Roles**: Separate execution and task roles
8. **Health Checks**: At multiple levels
9. **Auto Scaling**: Based on actual metrics
10. **Cost Monitoring**: Regular cost reviews


