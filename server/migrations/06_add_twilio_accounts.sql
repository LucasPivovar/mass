-- Tabela de múltiplos perfis Twilio por usuário
CREATE TABLE IF NOT EXISTS twilio_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    friendly_name VARCHAR(255) NOT NULL,
    twilio_account_sid VARCHAR(255) NOT NULL,
    twilio_auth_token VARCHAR(255) NOT NULL,
    twilio_phone_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Adicionar coluna twilio_account_id na tabela de campanhas
ALTER TABLE campaigns ADD COLUMN twilio_account_id INT NULL;
ALTER TABLE campaigns ADD FOREIGN KEY (twilio_account_id) REFERENCES twilio_accounts(id) ON DELETE SET NULL;
