pipeline {

    agent any

    environment {
        VPS_HOST = "72.61.218.192"
        VPS_USER = "root"
        PROJECT_PATH = "/root/projects/lovely-vet"

        NVM_DIR = "/root/.nvm"
        PNPM_HOME = "/root/.local/share/pnpm"

        NODE_ENV_SETUP = '''
            export NVM_DIR=/root/.nvm
            source $NVM_DIR/nvm.sh
            export PATH=$PATH:/root/.local/share/pnpm
        '''
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
    }


    stages {


        stage('🔌 Conectando à VPS') {

            when {
                branch 'master'
            }

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

            when {
                branch 'master'
            }

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

            when {
                branch 'master'
            }

            steps {

                sshagent(['vps-production']) {

                    sh '''
                    ssh ${VPS_USER}@${VPS_HOST} "
                        ${NODE_ENV_SETUP}

                        node -v &&
                        pnpm -v &&
                        pm2 -v
                    "
                    '''
                }
            }
        }


        stage('📦 pnpm install') {

            when {
                branch 'master'
            }

            steps {

                sshagent(['vps-production']) {

                    sh '''
                    ssh ${VPS_USER}@${VPS_HOST} "
                        ${NODE_ENV_SETUP}

                        cd ${PROJECT_PATH} &&
                        pnpm install
                    "
                    '''
                }
            }
        }


        stage('🏗️ pnpm build') {

            when {
                branch 'master'
            }

            steps {

                sshagent(['vps-production']) {

                    sh '''
                    ssh ${VPS_USER}@${VPS_HOST} "
                        ${NODE_ENV_SETUP}

                        cd ${PROJECT_PATH} &&
                        pnpm build
                    "
                    '''
                }
            }
        }


        stage('♻️ PM2 reload') {

            when {
                branch 'master'
            }

            steps {

                sshagent(['vps-production']) {

                    sh '''
                    ssh ${VPS_USER}@${VPS_HOST} "
                        ${NODE_ENV_SETUP}

                        cd ${PROJECT_PATH} &&
                        pm2 reload ecosystem.config.js --update-env
                    "
                    '''
                }
            }
        }


        stage('💾 PM2 save') {

            when {
                branch 'master'
            }

            steps {

                sshagent(['vps-production']) {

                    sh '''
                    ssh ${VPS_USER}@${VPS_HOST} "
                        ${NODE_ENV_SETUP}

                        pm2 save
                    "
                    '''
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