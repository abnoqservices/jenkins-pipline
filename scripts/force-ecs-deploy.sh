#!/bin/bash
# Force ECS deployment by stopping all tasks and deploying fresh

set -e

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-667659726830}"
ECR_REPOSITORY="${ECR_REPOSITORY:-pexifly-production/app}"
ECS_CLUSTER="${ECS_CLUSTER:-pexifly_production_app}"
ECS_SERVICE="${ECS_SERVICE:-pexifly-production-app-task-service}"
ECS_TASK_DEFINITION="${ECS_TASK_DEFINITION:-pexifly-production-app-task}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "=== Force ECS Deployment ==="
echo "Cluster: ${ECS_CLUSTER}"
echo "Service: ${ECS_SERVICE}"
echo "Image Tag: ${IMAGE_TAG}"

# Get all running tasks
echo "Finding running tasks..."
TASK_ARNS=$(aws ecs list-tasks \
    --cluster ${ECS_CLUSTER} \
    --service-name ${ECS_SERVICE} \
    --region ${AWS_REGION} \
    --query 'taskArns[]' \
    --output text)

if [ -n "$TASK_ARNS" ]; then
    echo "Stopping ${TASK_ARNS} running tasks..."
    for TASK_ARN in $TASK_ARNS; do
        echo "  - Stopping: $TASK_ARN"
        aws ecs stop-task \
            --cluster ${ECS_CLUSTER} \
            --task $TASK_ARN \
            --region ${AWS_REGION} || true
    done
    
    echo "Waiting for tasks to stop (30 seconds)..."
    sleep 30
else
    echo "No running tasks found"
fi

# Update service to force new deployment
echo "Forcing new deployment..."
aws ecs update-service \
    --cluster ${ECS_CLUSTER} \
    --service ${ECS_SERVICE} \
    --force-new-deployment \
    --region ${AWS_REGION}

echo "Waiting for service to stabilize..."
aws ecs wait services-stable \
    --cluster ${ECS_CLUSTER} \
    --services ${ECS_SERVICE} \
    --region ${AWS_REGION} || echo "Service may still be stabilizing..."

echo "=== Deployment Complete ==="
echo "Check your ECS service status in AWS Console"

