pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 40, unit: 'MINUTES')
        skipDefaultCheckout(true)
    }

    environment {
        AWS_REGION = 'ap-south-1'
        AWS_ACCOUNT_ID = '672135429898'

        ECR_REGISTRY = '672135429898.dkr.ecr.ap-south-1.amazonaws.com'
        FRONTEND_REPO = 'cloudpulse-frontend'
        BACKEND_REPO = 'cloudpulse-backend'

        FRONTEND_IMAGE = "${ECR_REGISTRY}/${FRONTEND_REPO}"
        BACKEND_IMAGE = "${ECR_REGISTRY}/${BACKEND_REPO}"

        SONAR_PROJECT_KEY = 'raju-cloudpulse_raju-cloudpulse'
        SONAR_ORGANIZATION = 'raju-cloudpulse'

        DEPLOY_HOST = '43.204.218.233'
        DEPLOY_USER = 'ec2-user'
        DEPLOY_DIR = '/opt/cloudpulse'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm

                sh '''
                    echo "Repository checked out successfully."
                    git log -1 --oneline
                '''
            }
        }

        stage('Frontend Quality Checks') {
            steps {
                dir('frontend') {
                    sh '''
                        set -eu
                        npm ci
                        npm run lint
                        npm run build
                    '''
                }
            }
        }


    stage('Backend Tests') {
            steps {
                sh '''
                    set -eu

                    python3 --version
                    python3 -m venv .venv

                    . .venv/bin/activate

                    python -m pip install --upgrade pip
                    pip install -r backend/requirements.txt

                    export PYTHONPATH="$WORKSPACE/backend"
                    python -m pytest -v backend/tests
                '''
            }
        }

        stage('SonarCloud Analysis') {
            steps {
                withSonarQubeEnv('SonarCloud') {
                    withCredentials([
                        string(
                            credentialsId: 'sonarcloud-token',
                            variable: 'SONAR_TOKEN'
                        )
                    ]) {
                        sh '''
                            set -eu

                            test -x /var/lib/jenkins/.sonar/sonar-scanner-8.2.0.6438-linux-x64/bin/sonar-scanner

                            /var/lib/jenkins/.sonar/sonar-scanner-8.2.0.6438-linux-x64/bin/sonar-scanner \
                              -Dsonar.organization="$SONAR_ORGANIZATION" \
                              -Dsonar.projectKey="$SONAR_PROJECT_KEY" \
                              -Dsonar.projectName="CloudPulse" \
                              -Dsonar.sources=frontend/src,backend/app \
                              -Dsonar.tests=backend/tests \
                              -Dsonar.exclusions="**/node_modules/**,**/dist/**,**/__pycache__/**,**/.venv/**" \
                              -Dsonar.python.version=3.12 \
                              -Dsonar.token="$SONAR_TOKEN"
                        '''
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    set -eu

                    docker build \
                      -t "$FRONTEND_IMAGE:$BUILD_NUMBER" \
                      -t "$FRONTEND_IMAGE:latest" \
                      ./frontend

                    docker build \
                      -t "$BACKEND_IMAGE:$BUILD_NUMBER" \
                      -t "$BACKEND_IMAGE:latest" \
                      ./backend
                '''
            }
        }

        stage('Push Images to Amazon ECR') {
            steps {
                sh '''
                    set -eu

                    aws sts get-caller-identity

                    aws ecr get-login-password \
                      --region "$AWS_REGION" \
                    | docker login \
                        --username AWS \
                        --password-stdin "$ECR_REGISTRY"

                    docker push "$FRONTEND_IMAGE:$BUILD_NUMBER"
                    docker push "$BACKEND_IMAGE:$BUILD_NUMBER"

                    docker push "$FRONTEND_IMAGE:latest"
                    docker push "$BACKEND_IMAGE:latest"
                '''
            }
        }

        stage('Prepare Deployment Files') {
            steps {
                sh '''
                    set -eu

                    test -f docker-compose.prod.yaml
                    test -f database/init.sql

                    # Verify that the database password is not tracked by Git.
                    if git ls-files --error-unmatch .env >/dev/null 2>&1; then
                        echo "ERROR: .env is tracked by Git. Remove it from tracking before deployment."
                        exit 1
                    fi
                '''

                sshagent(credentials: ['cloudpulse-deploy-ssh']) {
                    sh '''
                        set -eu

                        ssh -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            "$DEPLOY_USER@$DEPLOY_HOST" \
                            "mkdir -p '$DEPLOY_DIR/database'"

                        scp -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            docker-compose.prod.yaml \
                            "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_DIR/docker-compose.prod.yaml"

                        scp -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            database/init.sql \
                            "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_DIR/database/init.sql"
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ['cloudpulse-deploy-ssh']) {
                    sh '''
                        set -eu

                        ssh -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            "$DEPLOY_USER@$DEPLOY_HOST" \
                            "test -f '$DEPLOY_DIR/.env' && test -f '$DEPLOY_DIR/docker-compose.prod.yaml'"

                        ssh -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            "$DEPLOY_USER@$DEPLOY_HOST" \
                            "sudo aws ecr get-login-password --region '$AWS_REGION' | sudo docker login --username AWS --password-stdin '$ECR_REGISTRY'"

                        ssh -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            "$DEPLOY_USER@$DEPLOY_HOST" \
                            "cd '$DEPLOY_DIR' && sudo env BACKEND_IMAGE='$BACKEND_IMAGE:$BUILD_NUMBER' FRONTEND_IMAGE='$FRONTEND_IMAGE:$BUILD_NUMBER' docker compose --env-file .env -f docker-compose.prod.yaml pull"

                        ssh -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            "$DEPLOY_USER@$DEPLOY_HOST" \
                            "cd '$DEPLOY_DIR' && sudo env BACKEND_IMAGE='$BACKEND_IMAGE:$BUILD_NUMBER' FRONTEND_IMAGE='$FRONTEND_IMAGE:$BUILD_NUMBER' docker compose --env-file .env -f docker-compose.prod.yaml up -d --remove-orphans"

                        ssh -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            "$DEPLOY_USER@$DEPLOY_HOST" \
                            "sudo docker compose -f '$DEPLOY_DIR/docker-compose.prod.yaml' ps"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'CloudPulse pipeline completed successfully.'
            echo "Frontend image: ${env.FRONTEND_IMAGE}:${env.BUILD_NUMBER}"
            echo "Backend image: ${env.BACKEND_IMAGE}:${env.BUILD_NUMBER}"
            echo "Deployment host: ${env.DEPLOY_HOST}"
        }

        failure {
            echo 'CloudPulse pipeline failed. Review the failed stage in the Jenkins console output.'
        }

        always {
            echo 'CloudPulse CI/CD pipeline execution finished.'
        }
    }
}


