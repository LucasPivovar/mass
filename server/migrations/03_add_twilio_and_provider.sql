-- Adicionar novas colunas na tabela de configurações para Twilio e provedor de mensagens
ALTER TABLE settings
ADD COLUMN messaging_provider VARCHAR(50) DEFAULT 'zapi',
ADD COLUMN twilio_account_sid VARCHAR(255),
ADD COLUMN twilio_auth_token VARCHAR(255),
ADD COLUMN twilio_phone_number VARCHAR(100);

-- Adicionar coluna para mapear as variáveis do template e provedor na tabela de campanhas
ALTER TABLE campaigns
ADD COLUMN template_variables TEXT,
ADD COLUMN provider VARCHAR(50) DEFAULT 'zapi';

