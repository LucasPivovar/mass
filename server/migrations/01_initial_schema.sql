-- Tabela de contatos
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(50) NOT NULL,
    flag VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_sid VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de mensagens das campanhas
CREATE TABLE IF NOT EXISTS campaign_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT,
    contact_id INT,
    message_sid VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'queued',
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    twilio_sid VARCHAR(255),
    twilio_token VARCHAR(255),
    twilio_number VARCHAR(100),
    base_url VARCHAR(255)
);

-- Inserir configuração inicial se não existir
INSERT IGNORE INTO settings (id) VALUES (1);
