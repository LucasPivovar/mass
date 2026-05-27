#!/bin/bash

# ==========================================
# Script de Deploy: Bot Disparo (massflow.tech)
# ==========================================

echo ">>> Iniciando configuração do Bot Disparo no VPS..."

# 1. Redis (Docker)
echo ""
echo "=== [1/4] Configurando o Redis via Docker ==="

# Verifica se o Docker está instalado
if ! command -v docker &> /dev/null
then
    echo "Erro: Docker não encontrado! Por favor, instale o Docker no servidor."
    echo "Comando sugerido: sudo apt-get update && sudo apt-get install -y docker.io"
    exit 1
fi

# Verifica se o Docker Compose está instalado (v1 ou v2)
USE_COMPOSE_V2=false
if docker compose version &> /dev/null; then
    USE_COMPOSE_V2=true
elif ! command -v docker-compose &> /dev/null; then
    echo "Erro: Docker Compose não encontrado!"
    echo "Comando sugerido: sudo apt-get install -y docker-compose-plugin"
    exit 1
fi

echo "Iniciando o container persistente do Redis..."
if [ "$USE_COMPOSE_V2" = true ]; then
    docker compose up -d redis
else
    docker-compose up -d redis
fi

echo "Redis rodando com sucesso no Docker!"

# 2. Backend
echo ""
echo "=== [2/4] Configurando o Backend ==="
cd server || { echo "Erro: Pasta server não encontrada"; exit 1; }

echo "Instalando dependências do backend..."
npm install

# Instala o PM2 globalmente se não existir
if ! command -v pm2 &> /dev/null
then
    echo "PM2 não encontrado, instalando globalmente..."
    sudo npm install -g pm2
fi

echo "Criando .env do Backend (se não existir)..."
if [ ! -f .env ]; then
    echo "PORT=5000" > .env
    echo "DB_HOST=localhost" >> .env
    echo "DB_USER=root" >> .env
    echo "DB_PASSWORD=" >> .env
    echo "DB_NAME=bot_disparo" >> .env
    echo "JWT_SECRET=supersecretkey123" >> .env
    echo "REDIS_HOST=127.0.0.1" >> .env
    echo "REDIS_PORT=6379" >> .env
    echo "Base .env criado. Lembre-se de configurar a Z-API e dados do banco de dados!"
else
    # Se já existir, garante que as variáveis do Redis estejam documentadas ou presentes
    if ! grep -q "REDIS_HOST" .env; then
        echo "REDIS_HOST=127.0.0.1" >> .env
        echo "REDIS_PORT=6379" >> .env
        echo "Variáveis do Redis adicionadas ao seu .env existente."
    fi
fi

echo "Iniciando/Reiniciando o Backend com PM2 na porta 5000..."
pm2 start index.js --name "bot-disparo-api" || pm2 restart "bot-disparo-api"
pm2 save

cd ..

# 3. Frontend
echo ""
echo "=== [3/4] Configurando o Frontend ==="
cd client || { echo "Erro: Pasta client não encontrada"; exit 1; }

echo "Criando .env.production do Frontend..."
# Definimos VITE_API_URL com a URL absoluta do domínio para evitar que o operador OR
# no React caia no localhost:5000
echo "VITE_API_URL=https://massflow.tech" > .env.production

echo "Instalando dependências do frontend..."
npm install

echo "Fazendo o build do React para produção..."
npm run build

echo "Ajustando permissões da pasta dist para o Nginx..."
chmod -R 755 dist

cd ..

# 4. Finalização
echo ""
echo "=== [4/4] Configuração concluída! ==="
echo ""
echo "O Redis está rodando no Docker (127.0.0.1:6379)."
echo "O backend está rodando no PM2 (porta 5000)."
echo "O frontend foi compilado na pasta 'client/dist'."
echo ""
echo "PRÓXIMO PASSO:"
echo "Certifique-se de que a configuração do Nginx no arquivo /etc/nginx/sites-enabled/bot-disparo"
echo "está utilizando o root apontado para o seu diretório real, ex:"
echo "    root $(pwd)/client/dist;"
echo ""
echo "Depois, reinicie o Nginx com: sudo systemctl restart nginx"
echo ""
