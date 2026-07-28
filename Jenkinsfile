pipeline {
    agent any

    environment {
        VPS_HOST = "72.61.218.192"
        VPS_USER = "root"
        PROJECT_PATH = "~/projects/lovely-vet/"
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
    }

    stages {
        stage('Deploy VPS') {
            when {
                branch 'master'
            }
            stages {
                stage('🔌 Conectando à VPS') {
                    steps {
                        sshagent(['vps-production']) {
                            sh '''
                            ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "
                                hostname &&
                                whoami
                            "
                            '''
                        }
                    }
                }
                stage('📥 Git pull') {
                    steps {
                        sshagent(['vps-production']) {
                            sh '''
                            ssh ${VPS_USER}@${VPS_HOST} "
                                cd ${PROJECT_PATH} &&
                                git pull origin master
                            "
                            '''
                        }
                    }
                }
                stage('📦 pnpm install') {
                    steps {
                        sshagent(['vps-production']) {
                            sh '''
                            ssh ${VPS_USER}@${VPS_HOST} "
                                source ~/.bashrc &&
                                cd ${PROJECT_PATH} &&
                                pnpm install
                            "
                            '''
                        }
                    }
                }
                stage('🏗️ pnpm build') {
                    steps {
                        sshagent(['vps-production']) {
                            sh '''
                            ssh ${VPS_USER}@${VPS_HOST} "
                                cd ${PROJECT_PATH} &&
                                pnpm build
                            "
                            '''
                        }
                    }
                }
                stage('♻️ PM2 reload') {
                    steps {
                        sshagent(['vps-production']) {
                            sh '''
                            ssh ${VPS_USER}@${VPS_HOST} "
                                cd ${PROJECT_PATH} &&
                                pm2 reload ecosystem.config.js
                            "
                            '''
                        }
                    }
                }
                stage('💾 PM2 save') {
                    steps {
                        sshagent(['vps-production']) {
                            sh '''
                            ssh ${VPS_USER}@${VPS_HOST} "
                                pm2 save
                            "
                            '''
                        }
                    }
                }
            }
        }
    }
    post {
        success {
            echo '🚀 Deploy concluído com sucesso'
        }
        failure {
            echo '❌ Deploy falhou'
        }
    }
}