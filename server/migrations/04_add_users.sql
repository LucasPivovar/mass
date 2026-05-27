-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar coluna user_id às tabelas
ALTER TABLE contacts ADD COLUMN user_id INT NULL;
ALTER TABLE campaigns ADD COLUMN user_id INT NULL;
ALTER TABLE settings ADD COLUMN user_id INT NULL;

-- Garantir configuração única por usuário
ALTER TABLE settings ADD UNIQUE KEY unique_user_settings (user_id);

-- Adicionar chaves estrangeiras para deleção em cascata
ALTER TABLE contacts ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE campaigns ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE settings ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
