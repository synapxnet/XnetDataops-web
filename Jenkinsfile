pipeline {
  agent {
    kubernetes {
      inheritFrom 'nodejs bare'
      containerTemplate {
        name 'nodejs'
        image '127.0.0.1/library/jdk17-nodes:v1.1.1'
      }

    }

  }
  stages {
    stage('环境验证') {
      steps {
        container('nodejs') {
          sh '''
            echo "===== 环境信息 ====="
            echo "Node.js: $(node --version)"
            echo "npm: $(npm --version)"
            echo "pnpm: $(pnpm --version)"
          '''
        }

      }
    }

    stage('拉取代码') {
      steps {
        container('nodejs') {
          git(url: 'https://gitee.com/synap-xnet/xnet-mlops-web.git', credentialsId: 'gitee-synap-xnet-id', branch: 'master', changelog: true, poll: false)
        }

      }
    }

    stage('安装依赖') {
      steps {
        container('nodejs') {
          sh 'npm config set registry https://registry.npmmirror.com'
          sh 'npm install pnpm -g'
          sh 'pnpm install'
        }

      }
    }

    stage('构建核心依赖') {
      steps {
        container('nodejs') {
          sh 'pnpm run build --filter @vben-core/design'
          sh 'pnpm run build --filter @vben-core/shared'
          sh 'pnpm run build --filter @vben-core/typings'
        }

      }
    }

    stage('构建应用') {
      steps {
        container('nodejs') {
          sh 'pnpm run build --filter @vben/web-antd'
        }

      }
    }

    stage('构建并推送镜像') {
      agent none
      steps {
        container('nodejs') {
          withCredentials([usernamePassword(credentialsId: 'docker-registry-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
            script {
              sh 'podman --version || { echo "Podman is not installed"; exit 1; }'
              sh '''
echo "$DOCKER_PASS" | podman login http://127.0.0.1 -u "$DOCKER_USER" --password-stdin || { echo "Login failed"; exit 1; }
'''
              sh """
              podman build  -f Dockerfile -t 127.0.0.1/library/xnet-mlops-web:${env.BUILD_NUMBER} . || { echo "Build failed"; exit 1; }

              """
              sh """
              podman push 127.0.0.1/library/xnet-mlops-web:${env.BUILD_NUMBER} || { echo "Push failed"; exit 1; }
              """
            }

          }

        }

      }
    }

    stage('发布到环境') {
      agent none
      steps {
        container('nodejs') {
          withCredentials([kubeconfigContent(credentialsId: 'kube-secret', variable: 'KUBE_CONFIG')]) {
            sh '''
              mkdir -p ~/.kube
              echo "$KUBE_CONFIG" > ~/.kube/config
              chmod 600 ~/.kube/config
              kubectl version --client
              kubectl get nodes -n xnet-mlops || { echo "Failed to connect to Kubernetes cluster"; exit 1; }
              sed -i "s|image: 127.0.0.1/library/xnet-mlops-web:.*|image: 127.0.0.1/library/xnet-mlops-web:${BUILD_NUMBER}|" deploy/deploy.yaml
              kubectl apply -f deploy/deploy.yaml -n xnet-mlops || { echo "Failed to apply deploy.yaml"; exit 1; }
              kubectl rollout restart deployment xnet-mlops-web-deployment -n xnet-mlops || { echo "Failed to restart deployment"; exit 1; }
            '''
          }
        }
      }
    }

    stage('归档制品') {
      steps {
        container('nodejs') {
          sh 'cd apps/web-antd && tar -czf dist.tar.gz dist/'
        }

        archiveArtifacts(artifacts: 'apps/web-antd/dist.tar.gz', fingerprint: true, onlyIfSuccessful: true)
      }
    }

  }
}
