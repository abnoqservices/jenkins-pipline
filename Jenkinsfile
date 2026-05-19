pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = '667659726830'  // Update this with your AWS Account ID
        ECR_REPOSITORY = 'pexifly-production/app'
        ECS_CLUSTER = 'pexifly_production_app'
        ECS_SERVICE = 'pexifly-production-app-task-service'
        ECS_TASK_DEFINITION = 'pexifly-production-app-task'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def imageTag = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}"
                    
                    sh """
                        # Clean workspace to ensure no .env files
                        echo "Cleaning workspace..."
                        find . -name ".env*" -type f -delete 2>/dev/null || true
                        rm -f .env .env.local .env.production .env.development 2>/dev/null || true
                        
                        # Verify no .env files exist
                        if [ -f .env ]; then
                            echo "ERROR: .env file still exists in workspace!"
                            exit 1
                        fi
                        
                        # Build without cache to ensure .env files are not used
                        echo "Building Docker image with NEXT_PUBLIC_API_URL=https://api.pexifly.com/api"
                        docker build --no-cache --build-arg NEXT_PUBLIC_API_URL=https://api.pexifly.com/api -t ${ECR_REPOSITORY}:${IMAGE_TAG} .
                        
                        # Verify the built image contains the correct API URL
                        echo "Verifying built image..."
                        docker run --rm ${ECR_REPOSITORY}:${IMAGE_TAG} sh -c 'grep -r "api.pexifly.com" /app/.next/static/chunks/ 2>/dev/null | head -1 || echo "Could not verify in image"'
                        
                        docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${imageTag}
                    """
                }
            }
        }

        stage('Push to ECR') {
            steps {
                script {
                    def imageTag = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}"
                    
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                        
                        # Final verification before push
                        echo "=== Final Image Verification ==="
                        echo "Checking for correct API URL in image..."
                        docker run --rm ${ECR_REPOSITORY}:${IMAGE_TAG} sh -c 'grep -r "api.pexifly.com" /app/.next/static/chunks/ 2>/dev/null | head -1 || echo "WARNING: api.pexifly.com not found in bundle"'
                        echo "Checking for incorrect localhost URL..."
                        docker run --rm ${ECR_REPOSITORY}:${IMAGE_TAG} sh -c 'grep -r "127.0.0.1:8000" /app/.next/static/chunks/ 2>/dev/null | head -1 && echo "ERROR: Found 127.0.0.1:8000 in bundle!" || echo "✓ No localhost found"'
                        echo "=== End Verification ==="
                        
                        docker push ${imageTag}
                    """
                }
            }
        }

        stage('Update ECS Task Definition') {
            steps {
                script {
                    def imageTag = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}"
                    
                    sh """
                        # Get task definition
                        aws ecs describe-task-definition --task-definition ${ECS_TASK_DEFINITION} --region ${AWS_REGION} --query taskDefinition > task-definition.json
                        
                        # Use Python to filter metadata and update image (Python is usually available)
                        python3 << 'PYTHON_SCRIPT'
import json
import sys

# Read the task definition
with open('task-definition.json', 'r') as f:
    task_def = json.load(f)

# Remove metadata fields that can't be used in register-task-definition
fields_to_remove = ['taskDefinitionArn', 'revision', 'status', 'requiresAttributes', 
                    'compatibilities', 'registeredAt', 'registeredBy']
for field in fields_to_remove:
    task_def.pop(field, None)

# Update the image in the first container definition
if 'containerDefinitions' in task_def and len(task_def['containerDefinitions']) > 0:
    container = task_def['containerDefinitions'][0]
    container['image'] = '${imageTag}'
    
    # CRITICAL: Remove or override NEXT_PUBLIC_API_URL from environment variables
    # This ensures the build-time value is used, not a runtime override
    if 'environment' not in container:
        container['environment'] = []
    
    # Remove any existing NEXT_PUBLIC_API_URL from environment
    container['environment'] = [env for env in container['environment'] 
                               if env.get('name') != 'NEXT_PUBLIC_API_URL']
    
    # Add the correct NEXT_PUBLIC_API_URL (though it's already in the build, this ensures consistency)
    container['environment'].append({
        'name': 'NEXT_PUBLIC_API_URL',
        'value': 'https://api.pexifly.com/api'
    })
    
    print(f"Updated container image to: {container['image']}")
    print(f"Set NEXT_PUBLIC_API_URL to: https://api.pexifly.com/api")

# Write the updated task definition
with open('task-definition-updated.json', 'w') as f:
    json.dump(task_def, f, indent=2)
PYTHON_SCRIPT
                        
                        # Register new task definition
                        aws ecs register-task-definition --cli-input-json file://task-definition-updated.json --region ${AWS_REGION}
                        
                        # Clean up
                        rm -f task-definition.json task-definition-updated.json
                    """
                }
            }
        }

        stage('Deploy to ECS') {
            steps {
                script {
                    sh """
                        # Force stop all running tasks to ensure new image is used
                        echo "Stopping all running tasks..."
                        TASK_ARNS=\$(aws ecs list-tasks \
                            --cluster ${ECS_CLUSTER} \
                            --service-name ${ECS_SERVICE} \
                            --region ${AWS_REGION} \
                            --query 'taskArns[]' \
                            --output text)
                        
                        if [ -n "\$TASK_ARNS" ]; then
                            for TASK_ARN in \$TASK_ARNS; do
                                echo "Stopping task: \$TASK_ARN"
                                aws ecs stop-task \
                                    --cluster ${ECS_CLUSTER} \
                                    --task \$TASK_ARN \
                                    --region ${AWS_REGION} || true
                            done
                            echo "Waiting for tasks to stop..."
                            sleep 10
                        fi
                        
                        # Force new deployment with newly registered task definition (contains new image)
                        echo "Forcing new deployment with latest task definition..."
                        aws ecs update-service \
                            --cluster ${ECS_CLUSTER} \
                            --service ${ECS_SERVICE} \
                            --task-definition ${ECS_TASK_DEFINITION} \
                            --force-new-deployment \
                            --region ${AWS_REGION}
                        
                        echo "Waiting for service to stabilize..."
                        aws ecs wait services-stable \
                            --cluster ${ECS_CLUSTER} \
                            --services ${ECS_SERVICE} \
                            --region ${AWS_REGION} || true
                    """
                }
            }
        }

    }

    post {
        always {
            sh 'docker system prune -f'
        }
        success {
            echo 'Deployment completed successfully!'
        }
        failure {
            echo 'Deployment failed. Check logs for details.'
        }
    }
}

