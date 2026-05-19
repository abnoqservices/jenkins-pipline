#!/bin/bash
# Diagnose ECS deployment to find why API URL is wrong

set -e

AWS_REGION="${AWS_REGION:-us-east-1}"
ECS_CLUSTER="${ECS_CLUSTER:-pexifly_production_app}"
ECS_SERVICE="${ECS_SERVICE:-pexifly-production-app-task-service}"
ECR_REPOSITORY="${ECR_REPOSITORY:-667659726830.dkr.ecr.us-east-1.amazonaws.com/pexifly-production/app}"

echo "=== ECS Deployment Diagnosis ==="

# 1. Check current task definition
echo "1. Current Task Definition:"
aws ecs describe-services \
    --cluster ${ECS_CLUSTER} \
    --services ${ECS_SERVICE} \
    --region ${AWS_REGION} \
    --query 'services[0].taskDefinition' \
    --output text

# 2. Get running tasks
echo ""
echo "2. Running Tasks:"
TASK_ARNS=$(aws ecs list-tasks \
    --cluster ${ECS_CLUSTER} \
    --service-name ${ECS_SERVICE} \
    --region ${AWS_REGION} \
    --query 'taskArns[]' \
    --output text)

if [ -n "$TASK_ARNS" ]; then
    for TASK_ARN in $TASK_ARNS; do
        echo "  Task: $TASK_ARN"
        
        # Get task details
        echo "  Image:"
        aws ecs describe-tasks \
            --cluster ${ECS_CLUSTER} \
            --tasks $TASK_ARN \
            --region ${AWS_REGION} \
            --query 'tasks[0].containers[0].image' \
            --output text
        
        echo "  Environment Variables:"
        aws ecs describe-tasks \
            --cluster ${ECS_CLUSTER} \
            --tasks $TASK_ARN \
            --region ${AWS_REGION} \
            --query 'tasks[0].containers[0].environment[?name==`NEXT_PUBLIC_API_URL`]' \
            --output table || echo "    No NEXT_PUBLIC_API_URL env var"
    done
else
    echo "  No running tasks"
fi

# 3. Check latest task definition
echo ""
echo "3. Latest Task Definition Details:"
LATEST_TD=$(aws ecs describe-services \
    --cluster ${ECS_CLUSTER} \
    --services ${ECS_SERVICE} \
    --region ${AWS_REGION} \
    --query 'services[0].taskDefinition' \
    --output text)

aws ecs describe-task-definition \
    --task-definition ${LATEST_TD} \
    --region ${AWS_REGION} \
    --query 'taskDefinition.containerDefinitions[0].{image:image,env:environment[?name==`NEXT_PUBLIC_API_URL`]}' \
    --output json

# 4. Check ECR image tags
echo ""
echo "4. Latest ECR Images:"
aws ecr describe-images \
    --repository-name pexifly-production/app \
    --region ${AWS_REGION} \
    --query 'sort_by(imageDetails,&imagePushedAt)[-5:].{tags:imageTags[0],pushed:imagePushedAt}' \
    --output table

echo ""
echo "=== Diagnosis Complete ==="
echo ""
echo "To verify the actual image content, pull and inspect:"
echo "  aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPOSITORY%%/*}"
echo "  docker pull <IMAGE_TAG>"
echo "  docker run --rm <IMAGE_TAG> sh -c 'grep -r \"127.0.0.1\" /app/.next/static/chunks/ 2>/dev/null | head -1'"

