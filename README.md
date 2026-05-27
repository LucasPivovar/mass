# Bot Disparo - Sistema de Importação

Aplicação simples para upload de planilhas e cadastro em banco de dados MySQL.

## Requisitos
- Node.js
- MySQL

## Configuração

### 1. Banco de Dados
Certifique-se de que o MySQL está rodando e crie o banco de dados:
```sql
CREATE DATABASE bot_disparo;
```

### 2. Servidor (Backend)
Entre na pasta `server`, configure o arquivo `.env` com suas credenciais do MySQL e inicie o servidor:
```bash
cd server
npm install
node index.js
```

### 3. Cliente (Frontend)
Entre na pasta `client` e inicie a aplicação React:
```bash
cd client
npm install
npm run dev
```

## Credenciais de Acesso
- **Usuário:** admin
- **Senha:** admin

## Funcionalidades
- Login simples (JWT).
- Upload de planilhas (XLSX, XLS, CSV).
- Colunas esperadas na planilha: `nome` e `telefone`.
- Campo "Flag" para identificar lotes de dados no banco.
