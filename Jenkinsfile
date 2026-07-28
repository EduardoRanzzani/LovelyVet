pipeline {
    agent any
    environment {
        VPS_HOST = "72.61.218.192"
        VPS_USER = "root"
        PROJECT_PATH = "/root/projects/lovely-vet"
        NVM_DIR = "/root/.nvm"
        PNPM_HOME = "/root/.local/share/pnpm"
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

                stage('🔧 Preparando ambiente Node') {
                    steps {
                        sshagent(['vps-production']) {
                            sh '''
                            ssh ${VPS_USER}@${VPS_HOST} "
                                export NVM_DIR=${NVM_DIR} &&
                                source \$NVM_DIR/nvm.sh &&
                                export PATH=${PNPM_HOME}:\$PATH &&

                                node -v &&
                                pnpm -v &&
                                pm2 -v
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
                                export NVM_DIR=${NVM_DIR} &&
                                source \$NVM_DIR/nvm.sh &&
                                export PATH=${PNPM_HOME}:\$PATH &&

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
                                export NVM_DIR=${NVM_DIR} &&
                                source \$NVM_DIR/nvm.sh &&
                                export PATH=${PNPM_HOME}:\$PATH &&

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
                                export NVM_DIR=${NVM_DIR} &&
                                source \$NVM_DIR/nvm.sh &&
                                export PATH=${PNPM_HOME}:\$PATH &&

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
                                export NVM_DIR=${NVM_DIR} &&
                                source \$NVM_DIR/nvm.sh &&
                                export PATH=${PNPM_HOME}:\$PATH &&

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